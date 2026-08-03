import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BaziMainlinePanel from "@/components/BaziMainlinePanel";
import { computeBazi } from "@/lib/domain/bazi";
import {
  BAZI_DIRECT_NARRATIVE_CATALOG,
  BAZI_DIRECT_NARRATIVE_FACT_IDS,
  BING_FIRE_DOG_MONTH_NARRATIVE,
  BING_FIRE_DRAGON_MONTH_NARRATIVE,
  BING_FIRE_GOAT_MONTH_NARRATIVE,
  BING_FIRE_HORSE_MONTH_NARRATIVE,
  BING_FIRE_MONKEY_MONTH_NARRATIVE,
  BING_FIRE_OX_MONTH_NARRATIVE,
  BING_FIRE_PIG_MONTH_NARRATIVE,
  BING_FIRE_RABBIT_MONTH_NARRATIVE,
  BING_FIRE_RAT_MONTH_NARRATIVE,
  BING_FIRE_ROOSTER_MONTH_NARRATIVE,
  BING_FIRE_SNAKE_MONTH_NARRATIVE,
  BING_FIRE_TIGER_MONTH_NARRATIVE,
  DING_FIRE_DOG_MONTH_NARRATIVE,
  DING_FIRE_DRAGON_MONTH_NARRATIVE,
  DING_FIRE_GOAT_MONTH_NARRATIVE,
  DING_FIRE_HORSE_MONTH_NARRATIVE,
  DING_FIRE_MONKEY_MONTH_NARRATIVE,
  DING_FIRE_OX_MONTH_NARRATIVE,
  DING_FIRE_PIG_MONTH_NARRATIVE,
  DING_FIRE_RABBIT_MONTH_NARRATIVE,
  DING_FIRE_RAT_MONTH_NARRATIVE,
  DING_FIRE_ROOSTER_MONTH_NARRATIVE,
  DING_FIRE_SNAKE_MONTH_NARRATIVE,
  DING_FIRE_TIGER_MONTH_NARRATIVE,
  GUI_WATER_SNAKE_MONTH_NARRATIVE,
  JIA_WOOD_DOG_MONTH_NARRATIVE,
  JIA_WOOD_DRAGON_MONTH_NARRATIVE,
  JIA_WOOD_GOAT_MONTH_NARRATIVE,
  JIA_WOOD_HORSE_MONTH_NARRATIVE,
  JIA_WOOD_MONKEY_MONTH_NARRATIVE,
  JIA_WOOD_OX_MONTH_NARRATIVE,
  JIA_WOOD_PIG_MONTH_NARRATIVE,
  JIA_WOOD_RABBIT_MONTH_NARRATIVE,
  JIA_WOOD_RAT_MONTH_NARRATIVE,
  JIA_WOOD_ROOSTER_MONTH_NARRATIVE,
  JIA_WOOD_SNAKE_MONTH_NARRATIVE,
  JIA_WOOD_TIGER_MONTH_NARRATIVE,
  YI_WOOD_DOG_MONTH_NARRATIVE,
  YI_WOOD_DRAGON_MONTH_NARRATIVE,
  YI_WOOD_GOAT_MONTH_NARRATIVE,
  YI_WOOD_HORSE_MONTH_NARRATIVE,
  YI_WOOD_MONKEY_MONTH_NARRATIVE,
  YI_WOOD_OX_MONTH_NARRATIVE,
  YI_WOOD_PIG_MONTH_NARRATIVE,
  YI_WOOD_RABBIT_MONTH_NARRATIVE,
  YI_WOOD_RAT_MONTH_NARRATIVE,
  YI_WOOD_ROOSTER_MONTH_NARRATIVE,
  YI_WOOD_SNAKE_MONTH_NARRATIVE,
  YI_WOOD_TIGER_MONTH_NARRATIVE,
  selectBaziDirectNarrative
} from "@/lib/domain/baziDirectNarratives";
import { buildBaziMainlineNarrative } from "@/lib/domain/baziMainlineNarrative";
import type { ProfessionalBaziFactsV1 } from "@/lib/domain/professionalBaziFacts";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

// 本文件所有生辰均为虚构测试资料，不对应任何真实人物。
const calculatedAt = new Date("2026-08-01T02:00:00.000Z");
const approvedNarrative = `秋意铺开的时候你来到世间，草木褪去旺盛生机，天地慢慢沉静收敛。

你就像一株柔韧藤蔓，秋日不复温暖繁盛，无法肆意蔓延，总要循着周遭的框架，找到合适的地方缓缓生长。

秋里清劲之气自成边界，时刻与你相伴。

这让你本能留意人和事的边界、截止的期限、该承担的责任。只要环境条理分明，没有模糊不清的灰色地带，你便能清晰看清方向，安心向外舒展。`;

const reviewedNarratives = {
  "甲-寅": `你是挺立在林间的乔木，成长的路上，身边围绕着许多同样向上生长的枝干，彼此并肩而立，一同向着天空伸展力量。

你生于初春寅月，天地满是蓬勃新生的木气，和你本身的生机同频同向。你自带合群向上的生命力，天生擅长在集体环境里，守住自我节奏，顺势向上生长。

初春的林地，万物同步抽枝、同步向上。每个人都有自己的生长轨迹，也需要在共同的空间里，找准自己的位置、舒展自己的枝干。

放到生活里，面对需要协作、共同推进的事情，你会先笃定自己认可的方向，再从容选择与人同行、分工配合。你很懂得并肩成长，既能融入团队，又不会丢失自己的节奏。`,
  "丙-子": `你降生在静谧深沉的子月，大地寒气凝水，万物归于安静收敛，不见盛夏喧嚣蒸腾的热浪。

你恰似冬日柔和的日光，诞生在静水弥漫的深冬。四周绵长水气环绕托举你的光芒，为你的光亮划定稳定的边界，构建起清晰秩序。

如同暖阳铺洒在平静深水面上，流水不会吞没光芒，反而框定光线延展的范围，让光亮起伏有度、落点明确，自带恰到好处的分寸。

身处规章清楚、期限明确、权责划分明晰的环境中，你最容易稳住自身节奏，从容展现能力、稳步推进事务。条理分明的秩序，正是最适合你绽放光芒的舞台。`,
  "癸-巳": `初夏巳月，热浪笼罩大地，午后阵雨倏然落下。雨水顺着屋檐、石阶、枝叶四散流淌，短暂为燥热天地带来清凉。

你是盛夏适时而至的阵雨，环境发生变动时，能够快速调整状态。临时新增需求不会困住原定计划，重新整合现有条件，让有限资源及时发挥价值。

临时更改出行方案、调整聚会规模、利用手边食材烹制餐食，你擅长就地应变。不拘泥最初设想，顺应人、物、时间自然流转，为生活留存充足弹性。`
} as const;

const approvedYiWoodNarratives = {
  "乙-寅": `初春寅月，山林自沉睡中苏醒，高大乔木率先向上舒展枝干，林间新生藤蔓嫩芽，一同争抢洒落下来的阳光。

你便是这新生柔韧藤蔓，身边从不缺少强劲向上的生长力量。你不会局限在方寸土地扎根，懂得顺着树干、岩壁、邻侧枝条向外延展，在人人都奋力成长的环境里，走出专属自己的生长路线。

当多人结伴同行、事情节奏紧凑推进时，你擅长借力协作，串联起分散的人和行动。同时你必须守住自身目标，避免被周围急促的节奏裹挟，偏离原定前进方向。`,
  "乙-卯": `仲春卯月春意浓郁，遍地草木一同抽出新绿，枝条交错相依，每一片嫩叶都拥有舒展生长的空间。

你如同春风里自在延展的花枝，周遭有许多气质相近的同行者，但不会互相挤占成长空间，始终顺着自身的脉络生长。你向往平等的相处模式，清晰明白每个人都该保有独立的前行方向。

与人合作共事时，你十分看重彼此对等的分寸，在意每个人的想法能否被听见。你愿意结伴前行，坚持稳住自己的步调，让协作不再相互遮挡消耗，所有人各自舒展，共同拼凑出完整春色。`,
  "乙-辰": `春末辰月，雨水持续浸润土地，湿润泥土承载草木持续生长的重量。新芽不再仅仅破土而出，更需要扎牢根系、攀附支架，把一整个春天的生机稳稳落地。

你好比雨后沿着篱笆向上攀爬的藤蔓，身形柔软，却极度依赖稳固可靠的支点。面对任何事务，你会一步步确认可用时间、资源与权责边界，让四散延伸的枝叶找到清晰依靠。

适合长期持续推进的目标，你能够妥善理顺所有细碎环节，让每一份投入都留下看得见的成果。对你而言，真正长久的成长，不止向外拓展，更要稳固每一处联结。`,
  "乙-巳": `初夏巳月，暖意从地面升腾而起，藤蔓越过院墙，花朵在明朗日光中次第绽放。积蓄在枝干里的生机，慢慢转化为鲜明的形态与色彩。

你像是迎着暖风向外伸展的新藤，不愿让想法长久埋藏在心底。一旦沟通受阻、前路难行，你就会长出新的枝梢，换一条路径突破原有局限，把心中构思完整展露出来。

你擅长依靠表达、作品与实践打开局面。相比直接套用现成答案，你更倾向把构想落地实践，再根据现实反馈调整方向，让表达保有个人特质，也能够顺利传递给他人。`,
  "乙-午": `盛夏午月，庭院光照充沛，藤蔓铺展浓密绿荫，花果在稳定温热环境中慢慢成熟。草木不再急于追逐春光，从容释放长期积攒的生命力。

你是暖阳之下缓缓生长的藤木，擅长把自身感受、过往经验整理成他人容易接纳的形式。你注重沟通里的温度，愿意给事情充足的发展时间，让零散想法沉淀为完整成果。

不管是创作、分享经验还是与人沟通，你偏爱平缓连贯的节奏。你带来的不是转瞬即逝的火花，而是一片可供他人停留、获得安抚与启发的绿荫。`,
  "乙-未": `夏末未月，田野渐渐迎来收获期，藤架上果实慢慢沉甸甸垂下，大地余热尚存，枝叶、水汽、成熟作物错落分布。

你如同穿梭在田垄之间的柔韧藤蔓，视野不会局限在单一位置，能够看清整片环境里各方的配合关系。哪里已经成熟等待采收、哪里仍需持续照料、哪些资源可以重新调配，你都能快速理清。

面对人员、资源、时间持续变动的复杂局面，你善于调整排布顺序，盘活闲置资源，及时落地成熟成果。你的灵活变通不是漫无目的摸索，而是调动现有条件持续运转，最终收获实实在在的成果。`,
  "乙-申": `初秋申月，清风渐显凛冽，园圃内的藤蔓迎来修整时节。支架划定生长上限，枝条顺着规划有序牵引，肆意蔓延的枝叶逐步形成规整轮廓。

你是依附稳固支架向上攀爬的藤蔓，柔软的外表之下，能够接纳规则的价值。权责清晰、流程明确的环境里，你可以充分发挥细心的优势，一段段完成需要衔接的工作。

参与正式项目或是多人协作任务，你习惯先理清边界、先后顺序与交付标准，再规划自身行动。规则对你而言不是禁锢生长的围墙，而是结实藤架，规整繁杂事务，给你的能力持续向上攀升的通道。`,
  "乙-戌": `深秋戌月，土地日渐干燥，果实尽数收纳入库，藤架枝叶慢慢收敛。园圃不再追求新枝萌发，转而整理枝条、加固支架，为本季生长做好收尾。

你是历经一整季生长、根系牢牢抓着泥土的藤蔓，懂得及时收拢铺开的事务。遗漏细节、没有闭环的流程、需要妥善保存的成果，都会被你留意到。

项目临近收尾阶段，你可以耐心核对梳理，完善所有收尾工作，让长久付出真正沉淀。你追求的不只是表面上宣告结束，而是每一项责任妥善落实，所有成果妥善留存，方便后续再次取用。`,
  "乙-亥": `初冬亥月，气温降低，水汽沉入土层深处。草木收起外露枝叶，根系借着湿润泥土持续汲取养分。

你选择向内扎根生长的藤蔓，安静吸收知识、前人经验与成熟体系带来的养分。面对陌生领域，不会急于向外扩张，优先追溯源头，搭建完整认知脉络。

你擅长顺着成熟经验深入学习，将碎片化信息梳理成能够长久依靠的根基。只要拥有清晰指引与可靠支撑，你便能充分吸收养分，结合自身思考搭建全新联结。`,
  "乙-子": `仲冬子月，寒气深入大地，地面草木归于沉寂，细密根须仍在冻土之下，循着水源缓慢延伸。

你如同深埋土中持续感知的根须，外界越是喧嚣褪去，越能捕捉细碎线索之间暗藏的关联。面对零散杂乱的信息，你会避开表层杂音，顺着容易被忽略的线索深挖，搭建属于自己的认知。

现成思路无法解决问题时，你擅长转换视角，把容易被忽略的细节整合在一起。你的思考不会急于追求表层结果，优先在底层找到互通的逻辑，新的想法自然会慢慢萌发。`,
  "乙-丑": `冬末丑月，大地依旧寒凉，种子、物资、水源全部妥善储藏。田野尚未回暖，土层之下已经开始规划新一轮生长所需资源。

你好比蛰伏土中的细根，懂得环境受限时清点手中全部资源。分清资源优先级、规划可调动空间、提前筹备所需条件，依据现实需求有序安排。

面对尚未成熟的计划，你不会强行制造表面的繁荣景象，优先把基础资源安放到位。你能够盘活零散有限的条件，做好充足储备，待到气温回暖，便可顺势开启新一轮生长。`
} as const;

const approvedJiaWoodNarratives = {
  "甲-卯": `仲春卯月，整片林地草木蓬勃生长，新生枝条纵横交错，大量年轻乔木处在相近高度，一同争夺向上生长的空间。

你便是一株正在扎根塑造主干的乔木。身边有许多可以并肩前行的同行者，彼此能够相互借力，却也要共享有限的阳光与土地。身处同伴云集的环境，你必须分清属于自己的成长主线，防止枝干互相缠绕遮挡，阻碍主干持续向上伸展。

多人协同推进项目时，你擅长整合众人力量，主动梳理重叠工作、交叉权责与共用资源。你愿意携手同行，但不会让自身目标淹没在群体之中；始终守住核心任务，让协作形成一片层次分明、各自挺立的春日林海。`,
  "甲-辰": `春末辰月，连绵春雨浸润大地，泥土松软肥沃。乔木的根系顺着水源向四方延展，四处搜寻养分，支撑主干持续向上拔高。

你拥有开阔的成长土壤，不受狭小空间束缚，机遇、人脉、资源分散在各处。你会先锁定主干前进方向，再聚拢一切有用条件，服务最终目标。

接手资源繁杂、多方联动的事务，你拥有全局视野，能够发掘闲置资源，搭建全新联结。你不会漫无目的地四处延伸根系，每一次资源调动都目标清晰，让铺开的根系稳稳托起完整、稳固的成长框架。`,
  "甲-巳": `初夏巳月，日光日渐炽烈，乔木快速舒展树冠。根部长期积蓄的生命力顺着笔直树干向上输送，生长出茂密枝叶，撑开一片完整树荫。

你不单单追求自我成长，更希望积攒的能力落地发挥价值。纷乱的思路经过梳理，能够搭建清晰框架；多年积累的经验，也可以整理成通俗易懂、方便他人吸收的内容。

当工作需要输出方案、完成作品、沉淀经验时，你会从核心脉络逐层向外延展，最终的成果主干清晰、内容丰满。你的能力如同慢慢舒展的大树，结构规整，能够容纳他人停留学习、汲取参考。`,
  "甲-午": `盛夏午月，骄阳普照大地，高大乔木奋力将树冠伸向光亮处。灼热的气温催促枝叶快速扩张，多余、偏离方向的枯枝也变得一目了然。

你是烈日之下稳稳挺立的乔木，不愿核心想法被繁杂琐事层层掩盖。面对固化的旧模式、模糊不清的表达、阻碍推进的流程，你会直白点出问题，并且主动搭建更加清晰可行的新路径。

开展方案研讨、成果展示、流程优化时，你能够完整输出成熟判断。不止提出问题与质疑，更会拿出可行方案、清晰逻辑与落地成果开辟新方向，用扎实行动推动事情向前调整。`,
  "甲-未": `夏末未月，大地依旧温热，枝头果实陆续走向成熟。粗壮枝干需要承载持续增加的重量，根系不间断输送水分，保障一整年的生长顺利收尾。

你如同步入结果期的乔木，重心从持续扩张，转向稳定承载责任。时间规划、任务分配、成果交付，全部沿着清晰主干稳步落地。

面对长周期项目，你可以维持稳定推进节奏，把宏大目标拆解成一段段可落地的阶段性任务，持续跟进每一份责任。你不只看重最终收获，同样关注流程稳固、交接顺畅，保证每一份成果都拥有扎实完整的形成过程。`,
  "甲-申": `初秋申月，秋风渐劲，林间开启修剪时节。过于繁密的枝杈被逐步清理，乔木需要在外部压力之下守住主干，把有限生命力集中在关键方向。

面临紧迫任务，你可以快速甄别核心板块，主动舍弃次要琐事。懂得取舍，才能在时限紧张、标准提升的环境中维持完整节奏，避免精力四处分散。

临近截止日期、局面需要快速收拢时，你擅长划分任务优先级，优先处理影响全局的关键节点，集中力量攻克核心目标。外部压力不会令你慌乱，而是转化成有序安排、明确行动、可供核验的交付结果。`,
  "甲-酉": `仲秋酉月，天朗气清，园林进入精细化修整阶段。乔木依照标准修剪旁生枝条，树冠轮廓整齐端正，主干层次一目了然。

你好比经过规范修整的成材乔木，明白长久成长，既需要自然伸展，也需要遵守清晰尺度。面对标准化要求，逐项核对规范，保证流程、成果、权责一一对应。

身处制度完善、看重品质标准的环境，你可以搭建一套可追溯、可检验的工作体系：任务循序渐进，成果拥有明确标准，重要决策留有完整记录。规则不是强行把所有树木塑造成一模一样，而是帮你稳住主干，让长久积累以规整可信的方式展现出来。`,
  "甲-戌": `深秋戌月，土地慢慢干燥，林中的果实、木料、种子集中收纳整理。乔木根系早已蔓延整片土地，此刻需要分辨资源去向，分清当下使用与长期储备的物资。

你是根系广阔的乔木，能够看清各类资源的不同价值。面对分散的人力、物资与现有成果，围绕核心目标重新调配组合，让闲置资源流转到真正需要的地方。

项目进入资源整合阶段，你牢牢抓住影响全局的关键要素，及时调度、交换、分配资源，不让价值白白搁置。适度保留缓冲空间，推动成熟条件及时发挥作用，把一整季的积累转化为能够持续支撑后续事务的基础。`,
  "甲-亥": `初冬亥月，乔木收敛繁盛树冠，地下水流持续穿梭移动。粗壮根系绕过岩石与冻土，顺着隐秘水脉调整走向，持续为主干寻找新养分。

遭遇陌生难题时，你不会机械照搬现成方法。零散经验、跨领域知识、容易被忽略的线索，都会被你汇总，围绕核心主线重新梳理，搭建专属认知体系。

常规思路难以解决现状，你会暂时停下向外推进的脚步，深挖表象背后的内在关联。擅长整合多方信息，构建自洽的思考框架；当根系寻得水源，全新想法自然沿着主干向上萌发。`,
  "甲-子": `仲冬子月，长夜笼罩原野，水流在冻土深处汇聚。地面乔木看似安静沉寂，根系仍持续汲取深层养分，为来年枝叶繁茂储备根基。

踏入全新领域，你优先理清知识本源、整体背景与基础框架。可靠资料、成熟方法、有序经验如同滋养根系的水源，让你在行动前搭建稳固认知。

学习周期漫长的内容，你能够顺着体系层层钻研，串联概念、方法与背景，形成完整认知。不会依靠碎片化技巧代替底层根基；先筑牢主干支撑，再将所学转化成可以反复运用的能力。`,
  "甲-丑": `冬末丑月，冻土尚未完全消融，林场开始整理种子、木料与来年所需物资。乔木根系牢牢扎入土层，耐心等候各项基础条件筹备到位。

你是根基深厚的成熟乔木，面对尚未启动的计划，最先确认底层支撑是否牢靠。所需物资、时间规划、权责划分、执行次序，在正式启动前全部落实清楚。

事务处在筹备、维护阶段，你擅长梳理清单，持续补齐各类缺口，让每一项资源各有用途。不靠表面忙碌制造虚假进展，一层层夯实根基；待到环境回暖，主干便可沿着预先规划的方向稳步生长。`
} as const;

const approvedBingFireNarratives = {
  "丙-寅": `初春寅月，山林褪去冬日沉寂，万物初醒萌芽。湿润的枝干托着新生嫩芽，晨光穿透疏朗树梢，一点点照亮整片沉睡的大地。

你是破晓林间的初生朝阳，天生擅长在杂乱无序、尚未成型的局面里，找到可以突破和推进的清晰路径。面对陌生领域、零散信息和全新体验，你不会急于下定论、套答案，而是顺着内在逻辑深度梳理，让原本模糊的脉络慢慢变得通透清晰。

无论是学习新技能、踏入新环境，还是拆解复杂难题，你习惯自主搜集线索、多方尝试入口，再把有用的信息串联整合。你的成长从不是照搬现成经验，而是像晨光缓缓扫过林地，一步步摸索、沉淀出独属于自己的认知与方法。`,
  "丙-卯": `仲春卯月，春意愈发浓郁，林间草木枝叶繁茂，柔软的新枝随风舒展。暖阳穿过层层嫩叶，洒落均匀安稳的暖意，温柔滋养万物生长。

你是被繁花草木稳稳承托的春日日光，懂得依托成熟的经验、可靠的方法与正向的环境，稳住自身的光亮与节奏。接触全新领域时，你会先理清前因后果、摸透完整脉络，打好底层根基，不会用碎片化的片面认知替代系统学习。

跟随良师益友学习、融入正向圈层、复盘过往经历时，你擅长承接已有的积累，再用通俗真诚的方式重新解读、二次输出。你尊重既定的秩序与经验，更擅长活化其中的价值，让厚重的道理变得易懂、好用、贴近生活。`,
  "丙-辰": `春末辰月，连绵春雨滋养大地，云层散去后，澄澈日光铺满湿润的田野。水汽缓缓升腾，暖意慢慢渗入土层，稳稳催动万物扎根生长。

你是雨后温柔铺展的暖阳，不张扬、不炙热，擅长用持续、温和的暖意浸润周遭、盘活局面。面对沉闷繁杂、停滞拖沓的事务，你能一点点化解僵硬的状态，让松散的节奏回归有序，让停滞的事情重新流转起来。

打理生活琐事、筹备聚会活动、打磨作品细节时，你擅长把细腻的心意落地为具体行动。你的温暖从不只停留在言语表达，而是化作看得见、摸得着的体验，让身边的人切实感受到舒适与治愈。`,
  "丙-巳": `初夏巳月，天地开阔明朗，日光愈发充沛，地面热气缓缓升腾，与天光呼应。世间万物尽数展露鲜活姿态，处处是蓬勃向上的生机。

你是稳步攀升的初夏暖阳，自身明亮热忱，也善于接纳身边同样积极向上的光亮。在人才云集、氛围热烈的环境里，你不会刻意争锋芒、压他人，而是找准自己的定位，安稳舒展属于自己的光芒。

和同频伙伴交流探讨、创作协作、筹备活动时，你坦荡热忱、乐于分享，也懂得欣赏他人的优势。你偏爱平等通透的相处模式，让彼此的热情相互成就、彼此映照，在同向成长中各自保持独特节奏与专属亮点。`,
  "丙-午": `盛夏午月，日光抵达全年最盛的状态，大地热浪翻涌，万物肆意舒展、全力绽放。整片环境热烈鲜活，充满向外迸发的活力与力量。

你是盛夏灼灼的日光，极易融入热烈的氛围，擅长带动节奏、盘活全场。身处热闹的集体、高涨的团队氛围中，你能快速调动所有人的积极性，凝聚分散的力量，让众人同向发力、同步推进。

参与集体活动、团队攻坚、协同筹划时，你自带感染力，能够带动沉默的人参与进来，让松散的行动形成合力。同时你始终保有清晰的自我边界，懂得收敛过度高涨的情绪，稳住自身节奏，避免被外界热度消耗本心。`,
  "丙-未": `夏末未月，大地蓄满温热，枝头果实日渐饱满成熟。通透日光洒落，清晰照见枝叶长势、土壤干湿、作物成熟的细微差异，万物都在沉淀收成。

你是通透澄澈的原野日光，眼光细腻敏锐，总能精准发现藏在日常里的别扭、卡顿与不合理。面对固化的习惯、不畅的流程、将就的状态，你不会任由问题搁置积攒，敢于直面症结、主动优化。

无论是调整生活状态、优化作品细节，还是直面拖延已久的沟通问题，你都拒绝敷衍将就。你不只是单纯否定问题，更会主动调整方式、重组现有条件、疏通卡点，让积压的能量顺畅落地，让局面变得更合理、更舒服。`,
  "丙-申": `初秋申月，暑气褪去，天高气爽，天地变得澄澈开阔。成熟的果实、洁净的器物、流动的水面承接日光，处处散落着明亮的光影与可用的资源。

你是洒落秋野的灵动日光，适应力极强，擅长在动态变化的环境里灵活调整状态。局势、条件、人员发生变动时，你不会固守固有思路，而是快速适配变化，重新规划落点、盘活现有资源。

统筹出行安排、打理社交聚会、并行处理多项生活事务时，你擅长快速盘点时间、人力、物资，灵活重组搭配。你做事兼顾效率与弹性，既能充分利用现有条件，又能为突发变动预留空间，让每一份资源都物尽其用。`,
  "丙-酉": `仲秋酉月，天清月明，落日余晖洒满成熟的田野与规整的器物。金色光线顺着清晰的轮廓游走，一季的收获尽数归类、规整、落位，秩序井然。

你是安稳规整的秋日柔光，骨子里重视落地、兑现与秩序。你信奉踏实长久的成长，不追求短暂耀眼的热度，习惯把承诺、责任、日常事务一一落实到位，让生活与工作都保持稳定可控的状态。

规划日常作息、打理收支开销、维系长期约定、养护生活物件时，你耐心细致、逐项核对，让付出与收获精准对应。你的光亮温润持久，能把琐碎的日常打理得条理清晰、稳步运转，自带安稳靠谱的质感。`,
  "丙-戌": `深秋戌月，日照渐短，干燥的土地留存着白日余温。落日余晖与人间烟火相互映衬，驱散秋末的清冷，为天地留存温暖与归属感。

你是人间留存的暖光，擅长把自身的阅历、技能、温度转化为可以分享、可以滋养他人的力量。过往的经历沉淀成通透的感悟，熟练的技能养成从容的节奏，温柔的心意能温暖周遭的人与事。

为身边人付出、分享经验技艺、记录沉淀生活点滴时，你总能真诚交付、用心传递。你无需盛大的舞台，细碎真切的分享、温柔长久的陪伴，就能拉近人与人的距离，为彼此留住温暖可停留的方寸天地。`,
  "丙-亥": `初冬亥月，寒气渐盛，水汽弥漫，天色沉静清冷。日光铺在深水之上，随波纹轻轻晃动，外界节奏收紧、氛围肃穆，多了不少约束与压力。

你是寒水上始终笃定的日光，抗压能力极强。面对紧迫的时限、突发的变故、严肃的沟通场景，你能快速收敛杂念、稳住心神，精准抓住当下最核心、最关键的事。

遇到行程突变、紧急事务、棘手沟通时，你优先稳住局面、理清轻重缓急，有序推进解决问题。你懂得承压聚焦，把力量集中用在关键处，问题解决后又能及时松弛状态，让生活回归温暖松弛的常态。`,
  "丙-丑": `冬末丑月，冻土紧实坚硬，天地一片沉静。清冷日光斜扫原野，清晰照见冰层缝隙、墙面死角、长期遗留的陈旧问题，万物看似静止，实则暗藏破局的契机。

你是冬日锐利通透的日光，眼光通透，擅长看见僵化、低效、被习惯性忽略的问题。面对固化的模式、将就的习惯、压抑的状态，你不会随波逐流、敷衍维持，敢于突破僵局、尝试新的可能。

整理积压琐事、优化低效方法、直面内心积压的情绪、打破固有僵局时，你擅长从细微缺口切入，以清晰的表达、具体的调整、落地的行动，打破停滞固化的局面，为沉寂的生活破开新的生机与流动。`
} as const;

const approvedDingFireNarratives = {
  "丁-寅": `初春寅月，山林冒出新生嫩芽，晨间缓缓升腾暖意，入夜寒气依旧顺着枝叶漫向屋舍。木柴静静托举灯芯，窗前灯火稳定燃烧，为尚未回暖的春夜守住一方光亮。

你是得到木薪稳稳支撑的烛火，可靠的经验、清晰的方法与真诚的指引，能够让你的光芒长久持续。踏入陌生领域时，你习惯先寻找到可信的源头，顺着完整脉络层层理解，再把学到的知识沉淀成属于自己的判断。

跟随值得信赖的师长学习、研习一门手艺，或是梳理代代留存的故事时，你善于承接前人传递的火种。你不会生硬全盘复刻，用心守住其中真正具备价值的内核，让这束微光在全新的生活里持续发挥力量。`,
  "丁-卯": `仲春卯月，花木肆意舒展，茂密枝叶筛落天光。林间小路明暗交错，细碎灯火穿过层层叶隙，照亮许多白日容易被忽略的角落。

你如同提着灯火走入密林的行者，对细微信号、潜藏关联拥有极强感知力。面对没有标准答案的事情，你不会只盯着显眼的表象，善于捕捉语气、细节之间隐晦的呼应。

独自书写记录、研读小众内容、捕捉生活碎片，或是读懂未曾直白诉说的情绪时，你循着微弱线索不断深挖。将零散感受收纳于内心，经过安静沉淀梳理，最终转化成带有独特个人质感的思考与表达。`,
  "丁-辰": `春末辰月，阴雨连绵不散，潮气附着屋檐石阶久久不退。长廊间的灯火时常被湿风扰动，需要适时修剪灯芯，为积聚的烟雾留出流通的通道。

你是潮湿环境里持续燃烧的灯火，可以敏锐察觉各处卡点、模糊地带，看清是什么遮挡了原本清晰的思路。面对长久悬而未决的问题，你不会任由矛盾不断堆积，主动调整火苗与空气的平衡，打通阻滞之处。

修改反复卡顿的作品、理顺杂乱的生活规划，或是开展一场坦诚沟通时，你从具体的矛盾点入手。剔除多余累赘、直白说出真实诉求、重新规划行进路径，让被遮蔽的光线重新通透明朗。`,
  "丁-巳": `初夏巳月，天光开阔明亮，地面热气缓缓升腾，四处灶火蓬勃燃起。摇曳灯焰置身暖意充盈的环境，唯有找准自身落点，才不会被周遭更为炽烈的热度掩盖。

你是盛夏来临前专注安定的灯火，身处人才云集、观点纷呈的环境，懂得收拢光芒，聚焦自己需要照亮的领域。愿意依托集体氛围推进事务，同时清醒把控精力，避免消耗在无谓的竞争之中。

参与观点交流、协同创作或是组队筹备活动时，你主动认领具体事项，深耕细节。不去争夺全场的焦点，专注守好属于自己的一束光，让协作既能共享热忱，每个人的付出也清晰分明。`,
  "丁-午": `盛夏午月，白日热力充沛，夜色依旧留存暖意。街巷、庭院、水岸次第亮起灯火，每一盏灯拥有独立光晕，汇聚起来铺成绵延夜景。

你是成片灯火之中稳定燃烧的烛焰，和志趣相投之人相伴同行，很容易收获彼此理解与相互鼓舞。你不必成为最耀眼的光源，更加看重所有人守住自身节奏，在同一个空间持续发光。

和伙伴共同深耕爱好、加入长期互助小组，或是和同伴坚持生活规划时，你乐于分享进展，也认真肯定他人的付出。同行不是彼此消耗，而是灯火相互映照，支撑对方走完自己的道路。`,
  "丁-未": `夏末未月，庭院瓜果趋于成熟，各类食材送入厨房。灶间火焰维持平稳温度，缓缓催化食材，酝酿香气，把原料转化成可以端上桌的实在成果。

你是灶上从容持续的文火，懂得把控合适温度，耐心静待事物慢慢成型。不追求一蹴而就，持续微调磨合，让各类条件彼此相融，将内心心意转化为真切可感知的形态。

烹制餐食、养护花草、动手创作手作，或是安排一段舒缓的休憩时光，你擅长营造细腻丰盈的体验。借助气味、触感、色彩与节奏传递心意，让平凡日常拥有细细品味的温度。`,
  "丁-申": `初秋申月，空气清爽舒朗，金属灯架与器物擦拭干净。灯芯安置在稳固外壳之内，光线定向落在桌面与前路，不会随风漫无目的地飘散。

你是结构稳固的工作灯，习惯将有限精力、时间投入明确事务。承诺承担的事务、长期坚守的责任、需要持续维护的物品，都会纳入稳定节奏稳步推进。

规划家庭日程、定期养护物件、打理日常收支、持续陪伴他人时，你把责任落实到确切时间与行动之中。你的可靠不靠一时兴起的热情，依靠日复一日准时亮起，让身边人清楚知晓，这束光芒永远有着清晰落点。`,
  "丁-酉": `仲秋酉月，金属器皿、澄澈水面映出灯火，一簇火苗可以折射出多处灵动光影。秋收物资收纳进屋，资源在调配移动间，不断产生全新用途。

你如同能够穿梭各处的提灯，擅长发掘现有资源更多使用方式。遭遇临时新增需求，不会固守原定计划束手束脚，灵活调动手边物资、时间与人脉，寻找更适配的组合方案。

临时组织聚会、利用剩余物料布置场地、在路上妥善处理突发难题，你擅长就地取材、灵活调配。不会强行囤积所有条件，推动资源流转至急需之处，为充满变动的生活保留弹性空间。`,
  "丁-戌": `深秋戌月，空气干燥，枯枝落叶铺满大地。暗处一星火光足以照亮周遭，同时需要顺畅出口，防止热量持续封闭堆积。

你是积蓄许久、终于寻得出口的星火。长期压抑的想法、不断隐忍的情绪、不再适配的安排，一旦被你看清症结，便不会持续沉默内耗。

写下直抒胸臆的文字、完成带有个人态度的创作，或是在重要关系中表明自身立场，你将积攒已久的力量转化为清晰表达。不单单只为宣泄情绪，借着微光厘清矛盾，为停滞的局面打开改变的契机。`,
  "丁-亥": `初冬亥月，寒雨频繁，水汽笼罩整片夜色。岸边道路的灯火安置在牢固灯罩内，依照固定时序点亮，持续为路人标注前行方向。

你是妥善防护的夜灯，身处规则清晰、权责明确的环境，更容易长久维持稳定光亮。规章、约定与稳定节奏不会冲淡你的温度，反而帮助你把关怀落实得踏实可信。

夜间照料家人、长久恪守一项约定、在陪伴周期内保持稳定联系，你认真把控时间分寸。你的光芒不追逐喧嚣热闹，准时守候在既定位置，让责任与温情可以同时并存。`,
  "丁-子": `仲冬子月，漫漫长夜寒凉深沉，寒风与水汽不断侵袭旷野。原野之上灯火格外醒目，需要用心护住火苗，才能持续照亮脚下近处的路途。

你是风雪之中双手守护的烛火。面对节奏骤然加快、压力集中袭来、需要立刻响应的局面，快速收拢分散思绪，把全部光亮集中在当下最关键的事情上。

处理突发中断事项、开展紧迫沟通、应对混乱场面时，你优先守住底线，完成核心必要行动。不会试图同一时间兼顾远方琐事，先保证下一步方向清晰；压力消散之后，及时休整，让火苗回归平稳状态。`,
  "丁-丑": `冬末丑月，粮食食材妥善储藏屋内，厚实陶锅架于炉火之上。屋外冻土尚未消融，锅内汤水依靠持续小火缓缓翻滚，静待滋味充分交融。

你是冬日炉灶绵延不息的小火，依靠重复、耐心的照料，慢慢恢复生活温度。不依赖新鲜刺激，在熟悉日常里沉淀耐心，让平淡的时序慢慢生出安稳感。

清晨煮好热饮、缝补老旧物件、整理一周所需，或是安静陪伴疲惫之人，你将心意融入细碎行动。你的温暖不急于被众人看见，在一次次细微照料里不断累积，为清冷日子搭建柔软踏实的节奏。`
} as const;

const yiWoodMonthBindings = [
  { key: "乙-寅", branch: "寅", mainStem: "甲", mainTenGod: "劫财", narrative: YI_WOOD_TIGER_MONTH_NARRATIVE },
  { key: "乙-卯", branch: "卯", mainStem: "乙", mainTenGod: "比肩", narrative: YI_WOOD_RABBIT_MONTH_NARRATIVE },
  { key: "乙-辰", branch: "辰", mainStem: "戊", mainTenGod: "正财", narrative: YI_WOOD_DRAGON_MONTH_NARRATIVE },
  { key: "乙-巳", branch: "巳", mainStem: "丙", mainTenGod: "伤官", narrative: YI_WOOD_SNAKE_MONTH_NARRATIVE },
  { key: "乙-午", branch: "午", mainStem: "丁", mainTenGod: "食神", narrative: YI_WOOD_HORSE_MONTH_NARRATIVE },
  { key: "乙-未", branch: "未", mainStem: "己", mainTenGod: "偏财", narrative: YI_WOOD_GOAT_MONTH_NARRATIVE },
  { key: "乙-申", branch: "申", mainStem: "庚", mainTenGod: "正官", narrative: YI_WOOD_MONKEY_MONTH_NARRATIVE },
  { key: "乙-酉", branch: "酉", mainStem: "辛", mainTenGod: "七杀", narrative: YI_WOOD_ROOSTER_MONTH_NARRATIVE },
  { key: "乙-戌", branch: "戌", mainStem: "戊", mainTenGod: "正财", narrative: YI_WOOD_DOG_MONTH_NARRATIVE },
  { key: "乙-亥", branch: "亥", mainStem: "壬", mainTenGod: "正印", narrative: YI_WOOD_PIG_MONTH_NARRATIVE },
  { key: "乙-子", branch: "子", mainStem: "癸", mainTenGod: "偏印", narrative: YI_WOOD_RAT_MONTH_NARRATIVE },
  { key: "乙-丑", branch: "丑", mainStem: "己", mainTenGod: "偏财", narrative: YI_WOOD_OX_MONTH_NARRATIVE }
] as const;

const jiaWoodMonthBindings = [
  { key: "甲-寅", branch: "寅", mainStem: "甲", mainTenGod: "比肩", narrative: JIA_WOOD_TIGER_MONTH_NARRATIVE },
  { key: "甲-卯", branch: "卯", mainStem: "乙", mainTenGod: "劫财", narrative: JIA_WOOD_RABBIT_MONTH_NARRATIVE },
  { key: "甲-辰", branch: "辰", mainStem: "戊", mainTenGod: "偏财", narrative: JIA_WOOD_DRAGON_MONTH_NARRATIVE },
  { key: "甲-巳", branch: "巳", mainStem: "丙", mainTenGod: "食神", narrative: JIA_WOOD_SNAKE_MONTH_NARRATIVE },
  { key: "甲-午", branch: "午", mainStem: "丁", mainTenGod: "伤官", narrative: JIA_WOOD_HORSE_MONTH_NARRATIVE },
  { key: "甲-未", branch: "未", mainStem: "己", mainTenGod: "正财", narrative: JIA_WOOD_GOAT_MONTH_NARRATIVE },
  { key: "甲-申", branch: "申", mainStem: "庚", mainTenGod: "七杀", narrative: JIA_WOOD_MONKEY_MONTH_NARRATIVE },
  { key: "甲-酉", branch: "酉", mainStem: "辛", mainTenGod: "正官", narrative: JIA_WOOD_ROOSTER_MONTH_NARRATIVE },
  { key: "甲-戌", branch: "戌", mainStem: "戊", mainTenGod: "偏财", narrative: JIA_WOOD_DOG_MONTH_NARRATIVE },
  { key: "甲-亥", branch: "亥", mainStem: "壬", mainTenGod: "偏印", narrative: JIA_WOOD_PIG_MONTH_NARRATIVE },
  { key: "甲-子", branch: "子", mainStem: "癸", mainTenGod: "正印", narrative: JIA_WOOD_RAT_MONTH_NARRATIVE },
  { key: "甲-丑", branch: "丑", mainStem: "己", mainTenGod: "正财", narrative: JIA_WOOD_OX_MONTH_NARRATIVE }
] as const;

const bingFireMonthBindings = [
  { key: "丙-寅", branch: "寅", mainStem: "甲", mainTenGod: "偏印", narrative: BING_FIRE_TIGER_MONTH_NARRATIVE },
  { key: "丙-卯", branch: "卯", mainStem: "乙", mainTenGod: "正印", narrative: BING_FIRE_RABBIT_MONTH_NARRATIVE },
  { key: "丙-辰", branch: "辰", mainStem: "戊", mainTenGod: "食神", narrative: BING_FIRE_DRAGON_MONTH_NARRATIVE },
  { key: "丙-巳", branch: "巳", mainStem: "丙", mainTenGod: "比肩", narrative: BING_FIRE_SNAKE_MONTH_NARRATIVE },
  { key: "丙-午", branch: "午", mainStem: "丁", mainTenGod: "劫财", narrative: BING_FIRE_HORSE_MONTH_NARRATIVE },
  { key: "丙-未", branch: "未", mainStem: "己", mainTenGod: "伤官", narrative: BING_FIRE_GOAT_MONTH_NARRATIVE },
  { key: "丙-申", branch: "申", mainStem: "庚", mainTenGod: "偏财", narrative: BING_FIRE_MONKEY_MONTH_NARRATIVE },
  { key: "丙-酉", branch: "酉", mainStem: "辛", mainTenGod: "正财", narrative: BING_FIRE_ROOSTER_MONTH_NARRATIVE },
  { key: "丙-戌", branch: "戌", mainStem: "戊", mainTenGod: "食神", narrative: BING_FIRE_DOG_MONTH_NARRATIVE },
  { key: "丙-亥", branch: "亥", mainStem: "壬", mainTenGod: "七杀", narrative: BING_FIRE_PIG_MONTH_NARRATIVE },
  { key: "丙-子", branch: "子", mainStem: "癸", mainTenGod: "正官", narrative: BING_FIRE_RAT_MONTH_NARRATIVE },
  { key: "丙-丑", branch: "丑", mainStem: "己", mainTenGod: "伤官", narrative: BING_FIRE_OX_MONTH_NARRATIVE }
] as const;

const dingFireMonthBindings = [
  { key: "丁-寅", branch: "寅", mainStem: "甲", mainTenGod: "正印", narrative: DING_FIRE_TIGER_MONTH_NARRATIVE },
  { key: "丁-卯", branch: "卯", mainStem: "乙", mainTenGod: "偏印", narrative: DING_FIRE_RABBIT_MONTH_NARRATIVE },
  { key: "丁-辰", branch: "辰", mainStem: "戊", mainTenGod: "伤官", narrative: DING_FIRE_DRAGON_MONTH_NARRATIVE },
  { key: "丁-巳", branch: "巳", mainStem: "丙", mainTenGod: "劫财", narrative: DING_FIRE_SNAKE_MONTH_NARRATIVE },
  { key: "丁-午", branch: "午", mainStem: "丁", mainTenGod: "比肩", narrative: DING_FIRE_HORSE_MONTH_NARRATIVE },
  { key: "丁-未", branch: "未", mainStem: "己", mainTenGod: "食神", narrative: DING_FIRE_GOAT_MONTH_NARRATIVE },
  { key: "丁-申", branch: "申", mainStem: "庚", mainTenGod: "正财", narrative: DING_FIRE_MONKEY_MONTH_NARRATIVE },
  { key: "丁-酉", branch: "酉", mainStem: "辛", mainTenGod: "偏财", narrative: DING_FIRE_ROOSTER_MONTH_NARRATIVE },
  { key: "丁-戌", branch: "戌", mainStem: "戊", mainTenGod: "伤官", narrative: DING_FIRE_DOG_MONTH_NARRATIVE },
  { key: "丁-亥", branch: "亥", mainStem: "壬", mainTenGod: "正官", narrative: DING_FIRE_PIG_MONTH_NARRATIVE },
  { key: "丁-子", branch: "子", mainStem: "癸", mainTenGod: "七杀", narrative: DING_FIRE_RAT_MONTH_NARRATIVE },
  { key: "丁-丑", branch: "丑", mainStem: "己", mainTenGod: "食神", narrative: DING_FIRE_OX_MONTH_NARRATIVE }
] as const;

const wuEarthMonthBindings = [
  { key: "戊-寅", branch: "寅", mainStem: "甲", mainTenGod: "七杀", hash: "f1b6d7bc3f41e98fa9a35bb976bbff991eafeec0cefaefcc6d575cac9e5eb6a5" },
  { key: "戊-卯", branch: "卯", mainStem: "乙", mainTenGod: "正官", hash: "5ba24b2ca63754016b063b1eefb5ed6468e2276c610d513fd4bb4d8f8008d88f" },
  { key: "戊-辰", branch: "辰", mainStem: "戊", mainTenGod: "比肩", hash: "f7e57139f1095f8784bc56b975c59d14c6a0c156a94b089f7d9d6ce265658f3b" },
  { key: "戊-巳", branch: "巳", mainStem: "丙", mainTenGod: "偏印", hash: "2f6d22d96f67beecc0b774534083e14763cf418c7a80f16df845151765e7958e" },
  { key: "戊-午", branch: "午", mainStem: "丁", mainTenGod: "正印", hash: "81dc4fb345da7d5f802324ffe53ca85752c08794cc7bf9af0fc7c63a7451ba3f" },
  { key: "戊-未", branch: "未", mainStem: "己", mainTenGod: "劫财", hash: "b80b2f164824495fba6e469cea24b473989cacd5041536face525c12365ceeb9" },
  { key: "戊-申", branch: "申", mainStem: "庚", mainTenGod: "食神", hash: "cf97c30538866c2fe1c823e40ae552087332ca1b2c8d359dcf5dd351e5ba9700" },
  { key: "戊-酉", branch: "酉", mainStem: "辛", mainTenGod: "伤官", hash: "83c4ac8baed3eca71451f9fe9100198bf7ece54d5ad4d08b631acdcf10da6d61" },
  { key: "戊-戌", branch: "戌", mainStem: "戊", mainTenGod: "比肩", hash: "1730947c46d7b095528445458747bb79b642679f92779d037774c719e2eccf07" },
  { key: "戊-亥", branch: "亥", mainStem: "壬", mainTenGod: "偏财", hash: "edb2c33f55aa2d62c757d7f1e30d0ac59a98787ed0990f1a24c405b36a07686c" },
  { key: "戊-子", branch: "子", mainStem: "癸", mainTenGod: "正财", hash: "8aee1b358670e5935cae34cab999120d9fef8d14afec9821792b9f3ec93a059f" },
  { key: "戊-丑", branch: "丑", mainStem: "己", mainTenGod: "劫财", hash: "0aed9ef8f4d2101e309da0e3bdbea8eb6a3f2cadff566272c954184042727144" }
] as const;

const jiEarthMonthBindings = [
  { key: "己-寅", branch: "寅", mainStem: "甲", mainTenGod: "正官", hash: "fb9cf8ad3c090e97fd4f7274accab2dd9668e80526663379fe2e06475d1df4e9" },
  { key: "己-卯", branch: "卯", mainStem: "乙", mainTenGod: "七杀", hash: "6feabd67bf2f3df3bad9cdee5851db6d2a8ac0343875857b6e64a7dea0c9134a" },
  { key: "己-辰", branch: "辰", mainStem: "戊", mainTenGod: "劫财", hash: "3fc5c7ee64c6b18bf279668a3ba6d93f0d01fd820ed02a51971345507bbea595" },
  { key: "己-巳", branch: "巳", mainStem: "丙", mainTenGod: "正印", hash: "6a554962060ea805d590f46c2cc033ed66be0035dd00c6e0bac16618959c14f7" },
  { key: "己-午", branch: "午", mainStem: "丁", mainTenGod: "偏印", hash: "bed58ea53186b8f7c93824d7846773d24cd2981b6f44a407fb77099fe44dc5ee" },
  { key: "己-未", branch: "未", mainStem: "己", mainTenGod: "比肩", hash: "fa00e5fa29edc72ab23f12225e7bd63f18b59aaa4af320af2c6d741bfd0ca1f4" },
  { key: "己-申", branch: "申", mainStem: "庚", mainTenGod: "伤官", hash: "9b15631ac0286fca0d91eedb423df488d5e9aca09f16d4cb16b194014ed680bf" },
  { key: "己-酉", branch: "酉", mainStem: "辛", mainTenGod: "食神", hash: "8e4e826571d3fbd160103b3a5b50c506f4afba70f5083d09d889e074c728efc6" },
  { key: "己-戌", branch: "戌", mainStem: "戊", mainTenGod: "劫财", hash: "992f8728ddd6728c25cb7097e6f2e50bdb027361520b3ec508e6544aae80f7cc" },
  { key: "己-亥", branch: "亥", mainStem: "壬", mainTenGod: "正财", hash: "b8b11ede016d5e48c694618f439401df9f8881ea049c0de13a799d9edb10b0b4" },
  { key: "己-子", branch: "子", mainStem: "癸", mainTenGod: "偏财", hash: "48ebd77e5ad42be261d26fc1256d90ee0fbf3a43c0100aa0665aa54297fcc6c7" },
  { key: "己-丑", branch: "丑", mainStem: "己", mainTenGod: "比肩", hash: "1d4e38f5e52d6b7e32b4dd52b0d7413db996d44e8b65ff628379345469e37e0b" }
] as const;

const gengMetalMonthBindings = [
  { key: "庚-寅", branch: "寅", mainStem: "甲", mainTenGod: "偏财", hash: "b3d0ac1902e049a67c934a16e240510205e658e1d0a6997ace71323b61a0b876" },
  { key: "庚-卯", branch: "卯", mainStem: "乙", mainTenGod: "正财", hash: "d648d817844d185bb17f35b86be9b0b29e6c0242f3851301d54aae8e9a8e5514" },
  { key: "庚-辰", branch: "辰", mainStem: "戊", mainTenGod: "偏印", hash: "966fdaa688706bb2a3bbcda2b00cc9132ec08b2d4480fb7d1c6e0f73dc7141a1" },
  { key: "庚-巳", branch: "巳", mainStem: "丙", mainTenGod: "七杀", hash: "689054f919d1bcc7a64973c6525dfda46e0f6cf9e4e345c95e880b0278b62e37" },
  { key: "庚-午", branch: "午", mainStem: "丁", mainTenGod: "正官", hash: "f436f0428c1fd17f07ac456a14e33811453fe22b5555894edfcdbe4562bd8489" },
  { key: "庚-未", branch: "未", mainStem: "己", mainTenGod: "正印", hash: "67eaa2bf29191cc98ac4041e93fc3b561cb1686cda51e3df2b588d9df8363e2f" },
  { key: "庚-申", branch: "申", mainStem: "庚", mainTenGod: "比肩", hash: "2f143cf983bc86dbeca57e67e64c69df53441b51651d1685375de78a05db1eca" },
  { key: "庚-酉", branch: "酉", mainStem: "辛", mainTenGod: "劫财", hash: "84ef666e44cba40f2dcacaa7891573644577aed692bd927870cad2ed087899ca" },
  { key: "庚-戌", branch: "戌", mainStem: "戊", mainTenGod: "偏印", hash: "63f5bb392a5d462ea3aa3036412742efe46c1707d2a5379ab64fb8ff1aa78931" },
  { key: "庚-亥", branch: "亥", mainStem: "壬", mainTenGod: "食神", hash: "f1e0ab138a4a729efb1811436fbec5440358f8a93e9a21a8f0ab3966faf367bc" },
  { key: "庚-子", branch: "子", mainStem: "癸", mainTenGod: "伤官", hash: "b8e85d871d4b47e5486222658a0229e72779d6bbd61d98b2ffcb9582be9a5095" },
  { key: "庚-丑", branch: "丑", mainStem: "己", mainTenGod: "正印", hash: "a868996416481753b1180ed7de99de159eefe1207da89b57d5fd3dd267987b07" }
] as const;

const xinMetalMonthBindings = [
  { key: "辛-寅", branch: "寅", mainStem: "甲", mainTenGod: "正财", hash: "7ade4444c77cae45a6f4848a773762788769c8ded09e7db7113bb771bbafeb6f" },
  { key: "辛-卯", branch: "卯", mainStem: "乙", mainTenGod: "偏财", hash: "3ad015581d71c621742a25876737b5141a82b673a042348016b1b22719bff693" },
  { key: "辛-辰", branch: "辰", mainStem: "戊", mainTenGod: "正印", hash: "6d435ea91eb6d92787eb46d563ae494f36189b671ba00d43442bc1edde704525" },
  { key: "辛-巳", branch: "巳", mainStem: "丙", mainTenGod: "正官", hash: "d63bd272eb5983ab509d70463769efc5d78659140bc582341d95fd4e8b93af3f" },
  { key: "辛-午", branch: "午", mainStem: "丁", mainTenGod: "七杀", hash: "201b5e7fd01a06d27c866845d9dfdc82c1b318b0c6e3844565d679a09b9f7d01" },
  { key: "辛-未", branch: "未", mainStem: "己", mainTenGod: "偏印", hash: "750fee1811ca06cb23bf3e3e0c167eeb36dd96281d83bcf21b2b27ccac3879e3" },
  { key: "辛-申", branch: "申", mainStem: "庚", mainTenGod: "劫财", hash: "46f3d709afd32445137034bdcec0ef978f5e4812921a106b0e1c27bad5ed4f39" },
  { key: "辛-酉", branch: "酉", mainStem: "辛", mainTenGod: "比肩", hash: "b09491d3a9825c138583122d71c49c046edd5dd5c2b5ff56af6cb19e6ebfc546" },
  { key: "辛-戌", branch: "戌", mainStem: "戊", mainTenGod: "正印", hash: "480cd2e9e26dd2475749e7f20d3b6f0ac3b892289f947fa7da7bf809129f60b4" },
  { key: "辛-亥", branch: "亥", mainStem: "壬", mainTenGod: "伤官", hash: "3fa1b25e90d4d8261bcc098defa019a5d58f5e85c144735abd0abeb5577a05b3" },
  { key: "辛-子", branch: "子", mainStem: "癸", mainTenGod: "食神", hash: "995aafb8fa62fcc20e7b0bde910b413bfdfa6b59608fea7c8a6127d3a0f5d3d1" },
  { key: "辛-丑", branch: "丑", mainStem: "己", mainTenGod: "偏印", hash: "c018a91f58cc211883ed8bc915bee02a0ce6856f37ae4e5b27b22805b51de79e" }
] as const;

const renWaterMonthBindings = [
  { key: "壬-寅", branch: "寅", mainStem: "甲", mainTenGod: "食神", hash: "ff08ba9f119b2e53508bcb672dfdbb4cbfde11bf2dc16b5974971424942b9791" },
  { key: "壬-卯", branch: "卯", mainStem: "乙", mainTenGod: "伤官", hash: "53ed4403e4969f6385d2f2a22efa9cf4bf6bb8ce7bbd8e38e001495f2b37d18d" },
  { key: "壬-辰", branch: "辰", mainStem: "戊", mainTenGod: "七杀", hash: "5bf8d62b7632655e603672fdac5db9a8e75a48c7dd8411f6958fc2c03a5e9edd" },
  { key: "壬-巳", branch: "巳", mainStem: "丙", mainTenGod: "偏财", hash: "42fcbf93b534588272ee2f5d60563a808210f9b88879034f117a6dc61fd5dd37" },
  { key: "壬-午", branch: "午", mainStem: "丁", mainTenGod: "正财", hash: "1f5b4393439f2201a0d2403992c91912d95977305f5ae371b194cca8107b952e" },
  { key: "壬-未", branch: "未", mainStem: "己", mainTenGod: "正官", hash: "ecefe88da4ab64274f3f2c2807ef0a999308835deaeb77dcf36eacbe7c9dd6b3" },
  { key: "壬-申", branch: "申", mainStem: "庚", mainTenGod: "偏印", hash: "e3c1a7c0b32c2f5760f729f240a71d08842cdaec99dd18428e09ca6bea3ba0b2" },
  { key: "壬-酉", branch: "酉", mainStem: "辛", mainTenGod: "正印", hash: "dadb8814fe09d09c1221f0ef06507f68a8f69ae8a1237380eaaeee7180e1e446" },
  { key: "壬-戌", branch: "戌", mainStem: "戊", mainTenGod: "七杀", hash: "60ba63e8d736a06fc4229da42916c51ebc053a78fef5c480388b21769a9b5c0c" },
  { key: "壬-亥", branch: "亥", mainStem: "壬", mainTenGod: "比肩", hash: "e1f01002bcc5f2a19145eb15024a6e6e8ba387db8dd00bb83df6cf5830a714cd" },
  { key: "壬-子", branch: "子", mainStem: "癸", mainTenGod: "劫财", hash: "82de37eb33f0cfc86c5ab5fb497214562278e36146af13a97c972831e4c4ea5a" },
  { key: "壬-丑", branch: "丑", mainStem: "己", mainTenGod: "正官", hash: "993c6437716925bd9999001b4fb31785cce5d4ab5b3d71d730b410604afed33f" }
] as const;

const guiWaterMonthBindings = [
  { key: "癸-寅", branch: "寅", mainStem: "甲", mainTenGod: "伤官", hash: "a92ca80d2d8545cc6b07f813689edd85f9820c199e2b4c9100a1c3001bd812fd" },
  { key: "癸-卯", branch: "卯", mainStem: "乙", mainTenGod: "食神", hash: "5f0f25b72cf4e3336fc32039fc17788a5ce05f58f61624b0ca0c60a3735254ee" },
  { key: "癸-辰", branch: "辰", mainStem: "戊", mainTenGod: "正官", hash: "ad0170979b0bbbef2653a4eab613586c7f4c89d4df7137dac81e30a7a5cd85b2" },
  { key: "癸-巳", branch: "巳", mainStem: "丙", mainTenGod: "正财", hash: "b66895caf73f23ad96d9e1c7a8594fd89f232bf7fd2617ee302ce4776f0873f9" },
  { key: "癸-午", branch: "午", mainStem: "丁", mainTenGod: "偏财", hash: "554f7dfff53dde40cdd1ef7f6724b72110fd72ff8ad3e2710db44f48754a7372" },
  { key: "癸-未", branch: "未", mainStem: "己", mainTenGod: "七杀", hash: "5204c8e81f007055234284894f52ce21ead967438589183d8b6c044928f96bd9" },
  { key: "癸-申", branch: "申", mainStem: "庚", mainTenGod: "正印", hash: "97bc857af7efecd5482f2bba9410043b50401923fa4b04ded8a0fe280f5c84c1" },
  { key: "癸-酉", branch: "酉", mainStem: "辛", mainTenGod: "偏印", hash: "5268044d6eb9e41da6023883bb766f12479321e4feffb5442e456c6ad55d17f2" },
  { key: "癸-戌", branch: "戌", mainStem: "戊", mainTenGod: "正官", hash: "33fa6365838fe9fcd4dc1b32c2263bf2385322c23bfa0250fcc0cfe5d65bad08" },
  { key: "癸-亥", branch: "亥", mainStem: "壬", mainTenGod: "劫财", hash: "eb5a9bf9d7e59069a7a5ee3625db3a60f496592a8f82a444ff980bafdf2fecf2" },
  { key: "癸-子", branch: "子", mainStem: "癸", mainTenGod: "比肩", hash: "e7dcbebb70e8555a0a14b2afc28b91519a1b2cd61021213bbc85fe2a715b7b0a" },
  { key: "癸-丑", branch: "丑", mainStem: "己", mainTenGod: "七杀", hash: "7224c9a39dc989455c63ac6f7c54fb41eb7ebd3fc03de10ebd2cdcaecd854b7d" }
] as const;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const reviewedFictionalCases = [
  { key: "甲-寅", birthDate: "1980-02-11", narrative: JIA_WOOD_TIGER_MONTH_NARRATIVE },
  { key: "丙-子", birthDate: "1980-01-04", narrative: BING_FIRE_RAT_MONTH_NARRATIVE },
  { key: "癸-巳", birthDate: "1980-05-10", narrative: GUI_WATER_SNAKE_MONTH_NARRATIVE }
] as const;

function fictionalFacts(
  overrides: Partial<Parameters<typeof computeBazi>[0]> = {}
): ProfessionalBaziFactsV1 {
  const chart = computeBazi({
    gender: "other",
    birthDate: "1980-09-09",
    birthTime: "10:00",
    birthLocation: "虚构测试城市",
    timezone: "Asia/Shanghai",
    unknownTime: false,
    ...overrides
  });
  return buildProfessionalBaziFactsOnServer(chart, calculatedAt).professionalFacts;
}

function resolveFactPath(facts: ProfessionalBaziFactsV1, id: string): unknown {
  return id.split(".").reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, facts);
}

describe("Bazi direct narrative catalog", () => {
  it("stores exactly one hundred twenty manually reviewed texts as complete, versioned original entries", () => {
    const entries = Object.values(BAZI_DIRECT_NARRATIVE_CATALOG);
    const roosterEntry = BAZI_DIRECT_NARRATIVE_CATALOG["乙-酉"];

    expect(entries).toHaveLength(120);
    expect(roosterEntry).toMatchObject({
      id: "bazi-direct-narrative:乙-酉:v1",
      dayStem: "乙",
      monthBranch: "酉",
      requiredFacts: {
        dayElement: "木",
        dayYinYang: "阴",
        monthMainStem: "辛",
        monthMainTenGod: "七杀"
      },
      reviewStatus: "human_reviewed_approved",
      contentVersion: "bazi-direct-narrative-v1",
      interpretationKind: "project_original_modern_reading",
      factDependencies: BAZI_DIRECT_NARRATIVE_FACT_IDS
    });
    expect(YI_WOOD_ROOSTER_MONTH_NARRATIVE).toBe(approvedNarrative);
    expect(roosterEntry.narrative).toBe(approvedNarrative);
    expect(JIA_WOOD_TIGER_MONTH_NARRATIVE).toBe(reviewedNarratives["甲-寅"]);
    expect(BING_FIRE_RAT_MONTH_NARRATIVE).toBe(reviewedNarratives["丙-子"]);
    expect(GUI_WATER_SNAKE_MONTH_NARRATIVE).toBe(reviewedNarratives["癸-巳"]);
    entries.forEach(entry => {
      expect(entry).toMatchObject({
        reviewStatus: "human_reviewed_approved",
        contentVersion: "bazi-direct-narrative-v1",
        interpretationKind: "project_original_modern_reading",
        factDependencies: BAZI_DIRECT_NARRATIVE_FACT_IDS
      });
    });
  });

  it("covers all twelve 乙木 month branches with the approved text and exact main-command binding", () => {
    expect(yiWoodMonthBindings).toHaveLength(12);
    expect(new Set(yiWoodMonthBindings.map(item => item.branch))).toEqual(
      new Set(["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"])
    );

    yiWoodMonthBindings.forEach(({ key, branch, mainStem, mainTenGod, narrative }) => {
      const entry = BAZI_DIRECT_NARRATIVE_CATALOG[key];
      expect(entry).toMatchObject({
        dayStem: "乙",
        monthBranch: branch,
        requiredFacts: {
          dayElement: "木",
          dayYinYang: "阴",
          monthMainStem: mainStem,
          monthMainTenGod: mainTenGod
        },
        reviewStatus: "human_reviewed_approved"
      });
      expect(entry.narrative).toBe(narrative);

      const facts = structuredClone(fictionalFacts());
      facts.monthCommand.branch = { ...facts.monthCommand.branch, value: branch };
      facts.monthCommand.mainStem = { ...facts.monthCommand.mainStem, value: mainStem };
      facts.monthCommand.mainTenGod = { ...facts.monthCommand.mainTenGod, value: mainTenGod };
      const selection = selectBaziDirectNarrative(facts);
      expect(selection.status).toBe("available");
      expect(selection.status === "available" && selection.key).toBe(key);
      expect(selection.status === "available" && selection.entry.narrative).toBe(narrative);
    });
  });

  it("covers all twelve 甲木 month branches with the approved text and exact main-command binding", () => {
    expect(jiaWoodMonthBindings).toHaveLength(12);
    expect(new Set(jiaWoodMonthBindings.map(item => item.branch))).toEqual(
      new Set(["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"])
    );

    jiaWoodMonthBindings.forEach(({ key, branch, mainStem, mainTenGod, narrative }) => {
      const entry = BAZI_DIRECT_NARRATIVE_CATALOG[key];
      expect(entry).toMatchObject({
        dayStem: "甲",
        monthBranch: branch,
        requiredFacts: {
          dayElement: "木",
          dayYinYang: "阳",
          monthMainStem: mainStem,
          monthMainTenGod: mainTenGod
        },
        reviewStatus: "human_reviewed_approved"
      });
      expect(entry.narrative).toBe(narrative);

      const facts = structuredClone(fictionalFacts());
      facts.dayMaster.stem = { ...facts.dayMaster.stem, value: "甲" };
      facts.dayMaster.yinYang = { ...facts.dayMaster.yinYang, value: "阳" };
      facts.monthCommand.branch = { ...facts.monthCommand.branch, value: branch };
      facts.monthCommand.mainStem = { ...facts.monthCommand.mainStem, value: mainStem };
      facts.monthCommand.mainTenGod = { ...facts.monthCommand.mainTenGod, value: mainTenGod };
      const selection = selectBaziDirectNarrative(facts);
      expect(selection.status).toBe("available");
      expect(selection.status === "available" && selection.key).toBe(key);
      expect(selection.status === "available" && selection.entry.narrative).toBe(narrative);
    });
  });

  it("covers all twelve 丙火 month branches with the approved text and exact main-command binding", () => {
    expect(bingFireMonthBindings).toHaveLength(12);
    expect(new Set(bingFireMonthBindings.map(item => item.branch))).toEqual(
      new Set(["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"])
    );

    bingFireMonthBindings.forEach(({ key, branch, mainStem, mainTenGod, narrative }) => {
      const entry = BAZI_DIRECT_NARRATIVE_CATALOG[key];
      expect(entry).toMatchObject({
        dayStem: "丙",
        monthBranch: branch,
        requiredFacts: {
          dayElement: "火",
          dayYinYang: "阳",
          monthMainStem: mainStem,
          monthMainTenGod: mainTenGod
        },
        reviewStatus: "human_reviewed_approved"
      });
      expect(entry.narrative).toBe(narrative);

      const facts = structuredClone(fictionalFacts());
      facts.dayMaster.stem = { ...facts.dayMaster.stem, value: "丙" };
      facts.dayMaster.element = { ...facts.dayMaster.element, value: "火" };
      facts.dayMaster.yinYang = { ...facts.dayMaster.yinYang, value: "阳" };
      facts.monthCommand.branch = { ...facts.monthCommand.branch, value: branch };
      facts.monthCommand.mainStem = { ...facts.monthCommand.mainStem, value: mainStem };
      facts.monthCommand.mainTenGod = { ...facts.monthCommand.mainTenGod, value: mainTenGod };
      const selection = selectBaziDirectNarrative(facts);
      expect(selection.status).toBe("available");
      expect(selection.status === "available" && selection.key).toBe(key);
      expect(selection.status === "available" && selection.entry.narrative).toBe(narrative);
    });
  });

  it("covers all twelve 丁火 month branches with the approved text and exact main-command binding", () => {
    expect(dingFireMonthBindings).toHaveLength(12);
    expect(new Set(dingFireMonthBindings.map(item => item.branch))).toEqual(
      new Set(["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"])
    );

    dingFireMonthBindings.forEach(({ key, branch, mainStem, mainTenGod, narrative }) => {
      const entry = BAZI_DIRECT_NARRATIVE_CATALOG[key];
      expect(entry).toMatchObject({
        dayStem: "丁",
        monthBranch: branch,
        requiredFacts: {
          dayElement: "火",
          dayYinYang: "阴",
          monthMainStem: mainStem,
          monthMainTenGod: mainTenGod
        },
        reviewStatus: "human_reviewed_approved"
      });
      expect(entry.narrative).toBe(narrative);

      const facts = structuredClone(fictionalFacts());
      facts.dayMaster.stem = { ...facts.dayMaster.stem, value: "丁" };
      facts.dayMaster.element = { ...facts.dayMaster.element, value: "火" };
      facts.dayMaster.yinYang = { ...facts.dayMaster.yinYang, value: "阴" };
      facts.monthCommand.branch = { ...facts.monthCommand.branch, value: branch };
      facts.monthCommand.mainStem = { ...facts.monthCommand.mainStem, value: mainStem };
      facts.monthCommand.mainTenGod = { ...facts.monthCommand.mainTenGod, value: mainTenGod };
      const selection = selectBaziDirectNarrative(facts);
      expect(selection.status).toBe("available");
      expect(selection.status === "available" && selection.key).toBe(key);
      expect(selection.status === "available" && selection.entry.narrative).toBe(narrative);
    });
  });

  it("covers all twelve 戊土 and all twelve 己土 month branches with exact main-command bindings", () => {
    const branchSet = new Set(["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"]);
    expect(wuEarthMonthBindings).toHaveLength(12);
    expect(jiEarthMonthBindings).toHaveLength(12);
    expect(new Set(wuEarthMonthBindings.map(item => item.branch))).toEqual(branchSet);
    expect(new Set(jiEarthMonthBindings.map(item => item.branch))).toEqual(branchSet);

    ([
      { stem: "戊", yinYang: "阳", bindings: wuEarthMonthBindings },
      { stem: "己", yinYang: "阴", bindings: jiEarthMonthBindings }
    ] as const).forEach(({ stem, yinYang, bindings }) => {
      bindings.forEach(({ key, branch, mainStem, mainTenGod, hash }) => {
        const entry = BAZI_DIRECT_NARRATIVE_CATALOG[key];
        expect(entry).toMatchObject({
          dayStem: stem,
          monthBranch: branch,
          requiredFacts: {
            dayElement: "土",
            dayYinYang: yinYang,
            monthMainStem: mainStem,
            monthMainTenGod: mainTenGod
          },
          reviewStatus: "human_reviewed_approved"
        });
        expect(sha256(entry.narrative)).toBe(hash);

        const facts = structuredClone(fictionalFacts());
        facts.dayMaster.stem = { ...facts.dayMaster.stem, value: stem };
        facts.dayMaster.element = { ...facts.dayMaster.element, value: "土" };
        facts.dayMaster.yinYang = { ...facts.dayMaster.yinYang, value: yinYang };
        facts.monthCommand.branch = { ...facts.monthCommand.branch, value: branch };
        facts.monthCommand.mainStem = { ...facts.monthCommand.mainStem, value: mainStem };
        facts.monthCommand.mainTenGod = { ...facts.monthCommand.mainTenGod, value: mainTenGod };
        const selection = selectBaziDirectNarrative(facts);
        expect(selection.status).toBe("available");
        expect(selection.status === "available" && selection.key).toBe(key);
        expect(selection.status === "available" && selection.entry.narrative).toBe(entry.narrative);
      });
    });
  });

  it("covers all twelve 庚金 and all twelve 辛金 month branches with exact main-command bindings", () => {
    const branchSet = new Set(["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"]);
    expect(gengMetalMonthBindings).toHaveLength(12);
    expect(xinMetalMonthBindings).toHaveLength(12);
    expect(new Set(gengMetalMonthBindings.map(item => item.branch))).toEqual(branchSet);
    expect(new Set(xinMetalMonthBindings.map(item => item.branch))).toEqual(branchSet);

    ([
      { stem: "庚", yinYang: "阳", bindings: gengMetalMonthBindings },
      { stem: "辛", yinYang: "阴", bindings: xinMetalMonthBindings }
    ] as const).forEach(({ stem, yinYang, bindings }) => {
      bindings.forEach(({ key, branch, mainStem, mainTenGod, hash }) => {
        const entry = BAZI_DIRECT_NARRATIVE_CATALOG[key];
        expect(entry).toMatchObject({
          dayStem: stem,
          monthBranch: branch,
          requiredFacts: {
            dayElement: "金",
            dayYinYang: yinYang,
            monthMainStem: mainStem,
            monthMainTenGod: mainTenGod
          },
          reviewStatus: "human_reviewed_approved"
        });
        expect(sha256(entry.narrative)).toBe(hash);

        const facts = structuredClone(fictionalFacts());
        facts.dayMaster.stem = { ...facts.dayMaster.stem, value: stem };
        facts.dayMaster.element = { ...facts.dayMaster.element, value: "金" };
        facts.dayMaster.yinYang = { ...facts.dayMaster.yinYang, value: yinYang };
        facts.monthCommand.branch = { ...facts.monthCommand.branch, value: branch };
        facts.monthCommand.mainStem = { ...facts.monthCommand.mainStem, value: mainStem };
        facts.monthCommand.mainTenGod = { ...facts.monthCommand.mainTenGod, value: mainTenGod };
        const selection = selectBaziDirectNarrative(facts);
        expect(selection.status).toBe("available");
        expect(selection.status === "available" && selection.key).toBe(key);
        expect(selection.status === "available" && selection.entry.narrative).toBe(entry.narrative);
      });
    });
  });

  it("covers all twelve 壬水 and all twelve 癸水 month branches with exact main-command bindings", () => {
    const branchSet = new Set(["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"]);
    expect(renWaterMonthBindings).toHaveLength(12);
    expect(guiWaterMonthBindings).toHaveLength(12);
    expect(new Set(renWaterMonthBindings.map(item => item.branch))).toEqual(branchSet);
    expect(new Set(guiWaterMonthBindings.map(item => item.branch))).toEqual(branchSet);

    ([
      { stem: "壬", yinYang: "阳", bindings: renWaterMonthBindings },
      { stem: "癸", yinYang: "阴", bindings: guiWaterMonthBindings }
    ] as const).forEach(({ stem, yinYang, bindings }) => {
      bindings.forEach(({ key, branch, mainStem, mainTenGod, hash }) => {
        const entry = BAZI_DIRECT_NARRATIVE_CATALOG[key];
        expect(entry).toMatchObject({
          dayStem: stem,
          monthBranch: branch,
          requiredFacts: {
            dayElement: "水",
            dayYinYang: yinYang,
            monthMainStem: mainStem,
            monthMainTenGod: mainTenGod
          },
          reviewStatus: "human_reviewed_approved"
        });
        expect(sha256(entry.narrative)).toBe(hash);

        const facts = structuredClone(fictionalFacts());
        facts.dayMaster.stem = { ...facts.dayMaster.stem, value: stem };
        facts.dayMaster.element = { ...facts.dayMaster.element, value: "水" };
        facts.dayMaster.yinYang = { ...facts.dayMaster.yinYang, value: yinYang };
        facts.monthCommand.branch = { ...facts.monthCommand.branch, value: branch };
        facts.monthCommand.mainStem = { ...facts.monthCommand.mainStem, value: mainStem };
        facts.monthCommand.mainTenGod = { ...facts.monthCommand.mainTenGod, value: mainTenGod };
        const selection = selectBaziDirectNarrative(facts);
        expect(selection.status).toBe("available");
        expect(selection.status === "available" && selection.key).toBe(key);
        expect(selection.status === "available" && selection.entry.narrative).toBe(entry.narrative);
      });
    });
  });

  it("stores the eleven newly approved narratives verbatim and without duplicate articles", () => {
    Object.entries(approvedYiWoodNarratives).forEach(([key, narrative]) => {
      expect(BAZI_DIRECT_NARRATIVE_CATALOG[key as keyof typeof BAZI_DIRECT_NARRATIVE_CATALOG].narrative)
        .toBe(narrative);
    });
    expect(new Set(Object.values(approvedYiWoodNarratives)).size).toBe(11);
  });

  it("stores the eleven newly approved 甲木 narratives verbatim and without duplicate articles", () => {
    Object.entries(approvedJiaWoodNarratives).forEach(([key, narrative]) => {
      expect(BAZI_DIRECT_NARRATIVE_CATALOG[key as keyof typeof BAZI_DIRECT_NARRATIVE_CATALOG].narrative)
        .toBe(narrative);
    });
    expect(new Set(Object.values(approvedJiaWoodNarratives)).size).toBe(11);
  });

  it("stores the eleven newly approved 丙火 narratives verbatim and without duplicate articles", () => {
    Object.entries(approvedBingFireNarratives).forEach(([key, narrative]) => {
      expect(BAZI_DIRECT_NARRATIVE_CATALOG[key as keyof typeof BAZI_DIRECT_NARRATIVE_CATALOG].narrative)
        .toBe(narrative);
    });
    expect(new Set(Object.values(approvedBingFireNarratives)).size).toBe(11);
  });

  it("stores the twelve newly approved 丁火 narratives verbatim and without duplicate articles", () => {
    Object.entries(approvedDingFireNarratives).forEach(([key, narrative]) => {
      expect(BAZI_DIRECT_NARRATIVE_CATALOG[key as keyof typeof BAZI_DIRECT_NARRATIVE_CATALOG].narrative)
        .toBe(narrative);
    });
    expect(new Set(Object.values(approvedDingFireNarratives)).size).toBe(12);
  });

  it("stores the twenty-four approved soil narratives verbatim and without duplicate articles", () => {
    const bindings = [...wuEarthMonthBindings, ...jiEarthMonthBindings];
    const narratives = bindings.map(({ key, hash }) => {
      const narrative = BAZI_DIRECT_NARRATIVE_CATALOG[key].narrative;
      expect(sha256(narrative)).toBe(hash);
      return narrative;
    });

    expect(narratives).toHaveLength(24);
    expect(new Set(narratives).size).toBe(24);
    expect(new Set(bindings.map(item => item.hash)).size).toBe(24);
  });

  it("keeps every 戊土 month article substantively separate from the same-month 己土 article", () => {
    wuEarthMonthBindings.forEach(({ branch, key }) => {
      expect(BAZI_DIRECT_NARRATIVE_CATALOG[key].narrative)
        .not.toBe(BAZI_DIRECT_NARRATIVE_CATALOG[`己-${branch}`].narrative);
    });
  });

  it("stores the twenty-four approved metal narratives verbatim and without duplicate articles", () => {
    const bindings = [...gengMetalMonthBindings, ...xinMetalMonthBindings];
    const narratives = bindings.map(({ key, hash }) => {
      const narrative = BAZI_DIRECT_NARRATIVE_CATALOG[key].narrative;
      expect(sha256(narrative)).toBe(hash);
      return narrative;
    });

    expect(narratives).toHaveLength(24);
    expect(new Set(narratives).size).toBe(24);
    expect(new Set(bindings.map(item => item.hash)).size).toBe(24);
  });

  it("keeps every 庚金 month article substantively separate from the same-month 辛金 article", () => {
    gengMetalMonthBindings.forEach(({ branch, key }) => {
      expect(BAZI_DIRECT_NARRATIVE_CATALOG[key].narrative)
        .not.toBe(BAZI_DIRECT_NARRATIVE_CATALOG[`辛-${branch}`].narrative);
    });
  });

  it("stores the twenty-four approved water narratives verbatim and without duplicate articles", () => {
    const bindings = [...renWaterMonthBindings, ...guiWaterMonthBindings];
    const narratives = bindings.map(({ key, hash }) => {
      const narrative = BAZI_DIRECT_NARRATIVE_CATALOG[key].narrative;
      expect(sha256(narrative)).toBe(hash);
      return narrative;
    });

    expect(narratives).toHaveLength(24);
    expect(new Set(narratives).size).toBe(24);
    expect(new Set(bindings.map(item => item.hash)).size).toBe(24);
  });

  it("keeps every 壬水 month article substantively separate from the same-month 癸水 article", () => {
    renWaterMonthBindings.forEach(({ branch, key }) => {
      expect(BAZI_DIRECT_NARRATIVE_CATALOG[key].narrative)
        .not.toBe(BAZI_DIRECT_NARRATIVE_CATALOG[`癸-${branch}`].narrative);
    });
  });

  it("keeps every 丁火 month article substantively separate from the same-month 丙火 article", () => {
    dingFireMonthBindings.forEach(({ branch, narrative }) => {
      const bingNarrative = BAZI_DIRECT_NARRATIVE_CATALOG[`丙-${branch}`].narrative;
      expect(narrative).not.toBe(bingNarrative);
    });
  });

  it("keeps every 甲木 month article substantively separate from the same-month 乙木 article", () => {
    jiaWoodMonthBindings.forEach(({ branch, narrative }) => {
      const yiNarrative = BAZI_DIRECT_NARRATIVE_CATALOG[`乙-${branch}`].narrative;
      expect(narrative).not.toBe(yiNarrative);
    });
  });

  it("covers the complete one-hundred-twenty stem-month matrix", () => {
    const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const allCombinations = stems.flatMap(stem => branches.map(branch => `${stem}-${branch}`));
    const catalogKeys = new Set(Object.keys(BAZI_DIRECT_NARRATIVE_CATALOG));
    const uncovered = allCombinations.filter(key => !catalogKeys.has(key));

    expect(allCombinations).toHaveLength(120);
    expect(jiaWoodMonthBindings).toHaveLength(12);
    expect(yiWoodMonthBindings).toHaveLength(12);
    expect(bingFireMonthBindings).toHaveLength(12);
    expect(dingFireMonthBindings).toHaveLength(12);
    expect(wuEarthMonthBindings).toHaveLength(12);
    expect(jiEarthMonthBindings).toHaveLength(12);
    expect(gengMetalMonthBindings).toHaveLength(12);
    expect(xinMetalMonthBindings).toHaveLength(12);
    expect(renWaterMonthBindings).toHaveLength(12);
    expect(guiWaterMonthBindings).toHaveLength(12);
    expect(catalogKeys.size).toBe(120);
    expect(uncovered).toEqual([]);
  });

  it("selects each additional reviewed text from a real fictional chart", () => {
    reviewedFictionalCases.forEach(({ key, birthDate, narrative }) => {
      const facts = fictionalFacts({ birthDate, birthTime: "12:00" });
      const selection = selectBaziDirectNarrative(facts);

      expect(`${facts.dayMaster.stem.value}-${facts.monthCommand.branch.value}`).toBe(key);
      expect(selection.status).toBe("available");
      expect(selection.status === "available" && selection.entry.narrative).toBe(narrative);
    });
  });

  it("selects the approved text only when every required 乙木酉月 fact matches", () => {
    const facts = fictionalFacts();
    const selection = selectBaziDirectNarrative(facts);

    expect(facts.dayMaster).toMatchObject({
      stem: { value: "乙", certainty: "confirmed" },
      element: { value: "木", certainty: "confirmed" },
      yinYang: { value: "阴", certainty: "confirmed" }
    });
    expect(facts.monthCommand).toMatchObject({
      branch: { value: "酉", certainty: "confirmed" },
      mainStem: { value: "辛", certainty: "confirmed" },
      mainTenGod: { value: "七杀", certainty: "confirmed" }
    });
    expect(selection.status).toBe("available");
    expect(selection.status === "available" && selection.entry.narrative).toBe(approvedNarrative);
    expect(selectBaziDirectNarrative).toHaveLength(1);
  });

  it("has no uncovered confirmed stem-month combination", () => {
    const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

    stems.forEach(stem => {
      branches.forEach(branch => {
        expect(BAZI_DIRECT_NARRATIVE_CATALOG)
          .toHaveProperty(`${stem}-${branch}`);
      });
    });
  });

  it("stops on month candidates or unavailable dependencies", () => {
    const uncertainMonth = structuredClone(fictionalFacts());
    uncertainMonth.uncertainty.monthPillarCandidates = {
      ...uncertainMonth.uncertainty.monthPillarCandidates,
      value: ["乙酉", "甲申"],
      certainty: "uncertain"
    };
    const unavailableMainTenGod = structuredClone(fictionalFacts());
    unavailableMainTenGod.monthCommand.mainTenGod = {
      ...unavailableMainTenGod.monthCommand.mainTenGod,
      value: null,
      certainty: "unavailable"
    };
    const uncertainMonthBranch = structuredClone(fictionalFacts());
    uncertainMonthBranch.monthCommand.branch = {
      ...uncertainMonthBranch.monthCommand.branch,
      certainty: "uncertain"
    };
    const mismatchedMainTenGod = structuredClone(fictionalFacts());
    mismatchedMainTenGod.monthCommand.mainTenGod = {
      ...mismatchedMainTenGod.monthCommand.mainTenGod,
      value: "正官"
    };

    expect(selectBaziDirectNarrative(uncertainMonth)).toEqual({
      status: "not_available",
      reason: "month_pillar_uncertain"
    });
    expect(selectBaziDirectNarrative(unavailableMainTenGod)).toEqual({
      status: "not_available",
      reason: "necessary_fact_unavailable"
    });
    expect(selectBaziDirectNarrative(uncertainMonthBranch)).toEqual({
      status: "not_available",
      reason: "necessary_fact_unavailable"
    });
    expect(selectBaziDirectNarrative(mismatchedMainTenGod)).toEqual({
      status: "not_available",
      reason: "necessary_fact_unavailable"
    });
  });

  it("keeps the reading when only the unknown hour changes", () => {
    const facts = fictionalFacts({ birthTime: "", unknownTime: true });
    const selection = selectBaziDirectNarrative(facts);

    expect(facts.input.timeKnown.value).toBe(false);
    expect(selection.status).toBe("available");
  });

  it("does not change the reading when non-plate labels change", () => {
    const first = selectBaziDirectNarrative(fictionalFacts({
      gender: "male",
      birthLocation: "虚构甲城"
    }));
    const second = selectBaziDirectNarrative(fictionalFacts({
      gender: "female",
      birthLocation: "虚构乙城"
    }));

    expect(first).toEqual(second);
  });

  it("binds every declared dependency to a real professional fact", () => {
    const facts = fictionalFacts();
    const selection = selectBaziDirectNarrative(facts);
    expect(selection.status).toBe("available");
    if (selection.status !== "available") return;

    selection.entry.factDependencies.forEach(id => {
      const fact = resolveFactPath(facts, id);
      expect(fact).toBeDefined();
      expect(fact).toHaveProperty("certainty", "confirmed");
    });
  });

  it("has no generic article fallback or runtime AI dependency", () => {
    const source = readFileSync("src/lib/domain/baziDirectNarratives.ts", "utf8");

    expect(Object.keys(BAZI_DIRECT_NARRATIVE_CATALOG)).toEqual([
      "乙-酉", "乙-寅", "乙-卯", "乙-辰", "乙-巳", "乙-午", "乙-未", "乙-申",
      "乙-戌", "乙-亥", "乙-子", "乙-丑", "甲-寅", "甲-卯", "甲-辰", "甲-巳",
      "甲-午", "甲-未", "甲-申", "甲-酉", "甲-戌", "甲-亥", "甲-子", "甲-丑",
      "丙-子", "丙-寅", "丙-卯", "丙-辰", "丙-巳", "丙-午", "丙-未", "丙-申",
      "丙-酉", "丙-戌", "丙-亥", "丙-丑", "丁-寅", "丁-卯", "丁-辰", "丁-巳",
      "丁-午", "丁-未", "丁-申", "丁-酉", "丁-戌", "丁-亥", "丁-子", "丁-丑",
      "戊-寅", "戊-卯", "戊-辰", "戊-巳", "戊-午", "戊-未", "戊-申", "戊-酉",
      "戊-戌", "戊-亥", "戊-子", "戊-丑", "己-寅", "己-卯", "己-辰", "己-巳",
      "己-午", "己-未", "己-申", "己-酉", "己-戌", "己-亥", "己-子", "己-丑",
      "庚-寅", "庚-卯", "庚-辰", "庚-巳", "庚-午", "庚-未", "庚-申", "庚-酉",
      "庚-戌", "庚-亥", "庚-子", "庚-丑", "辛-寅", "辛-卯", "辛-辰", "辛-巳",
      "辛-午", "辛-未", "辛-申", "辛-酉", "辛-戌", "辛-亥", "辛-子", "辛-丑",
      "壬-寅", "壬-卯", "壬-辰", "壬-巳", "壬-午", "壬-未", "壬-申", "壬-酉",
      "壬-戌", "壬-亥", "壬-子", "壬-丑", "癸-寅", "癸-卯", "癸-辰", "癸-午",
      "癸-未", "癸-申", "癸-酉", "癸-戌", "癸-亥", "癸-子", "癸-丑",
      "癸-巳"
    ]);
    expect(source).not.toMatch(/@\/lib\/ai|openai|anthropic|generateText|chatCompletion/);
    expect(source).not.toMatch(/你出生在.*季节|你像.*物象|内容正在生成/);
  });

  it("renders the approved article in the complete reading order without technical basis text", () => {
    const narrative = buildBaziMainlineNarrative(fictionalFacts());
    expect(narrative).not.toBeNull();
    const markup = renderToStaticMarkup(
      createElement(BaziMainlinePanel, { narrative: narrative! })
    );

    approvedNarrative.split("\n\n").forEach(paragraph => {
      expect(markup).toContain(paragraph);
    });
    const orderedTitles = ["基础信息", "日主", "物象", "阴阳", "五行", "十神", "地支关系"];
    const titlePositions = orderedTitles.map(title => markup.indexOf(`>${title}<`));
    expect(titlePositions.every(position => position > -1)).toBe(true);
    expect(titlePositions).toEqual([...titlePositions].sort((first, second) => first - second));
    expect(markup).not.toContain("日主乙木 · 月令酉金 · 本气辛金 · 七杀");
    expect(markup).not.toMatch(/盘面依据|为什么这样说|看懂这条|专业分析|现代意象|白话解读|技术追溯|未参与本次统计|尚未确认/);
    expect(markup).not.toMatch(/<details|<summary/);
  });

  it("renders the direct article for a formerly uncovered confirmed chart", () => {
    const narrative = buildBaziMainlineNarrative(fictionalFacts({
      birthDate: "1992-04-16"
    }));
    expect(narrative).not.toBeNull();
    expect(narrative!.directNarrative).toMatchObject({
      status: "available",
      key: "壬-辰"
    });

    const markup = renderToStaticMarkup(
      createElement(BaziMainlinePanel, { narrative: narrative! })
    );
    expect(markup).toContain("基础信息");
    expect(markup).toContain("五行");
    expect(markup).toContain("十神");
    expect(markup).toContain('id="bazi-direct-imagery-title">物象</h3>');
    expect(markup).toContain(BAZI_DIRECT_NARRATIVE_CATALOG["壬-辰"].narrative.split("\n\n")[0]);
    expect(markup).not.toContain("内容正在生成");
  });
});
