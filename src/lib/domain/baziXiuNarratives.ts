import {
  XIU_NAMES,
  type BaziBirthXiuFactsV1,
  type XiuGong,
  type XiuName,
  type XiuShou,
  type XiuZheng
} from "./baziBirthXiuFacts";

export interface BaziXiuNarrativeEntry {
  xiu: XiuName;
  zheng: XiuZheng;
  animal: string;
  gong: XiuGong;
  shou: XiuShou;
  reviewStatus: "human_reviewed_approved";
  narrative: string;
}

export type BaziXiuNarrativeSelection =
  | { status: "available"; entry: BaziXiuNarrativeEntry }
  | {
      status: "not_available";
      reason: "facts_absent" | "facts_unavailable" | "facts_incomplete" | "facts_mismatch" | "narrative_unreviewed";
    };

export const BAZI_XIU_NARRATIVE_CATALOG: Record<XiuName, BaziXiuNarrativeEntry> = {
  角: { xiu: "角", zheng: "木", animal: "蛟", gong: "东", shou: "青龙", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为角木蛟。角宿以木为七政，物象为蛟，归东方青龙星宫。\n\n在传统四象意象中，角星如同青龙额前初生双角，自春日地平线缓缓探出轮廓；蛟随云气悠然舒展，化作东方天际刚刚抬升的弧线。这片青绿辽阔、向远方无限延展的画面，是历法为你的出生日期留下的传统日值意象。" },
  亢: { xiu: "亢", zheng: "金", animal: "龙", gong: "东", shou: "青龙", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为亢金龙。亢宿以金为七政，物象为龙，归东方青龙星宫。\n\n在传统四象意象中，龙颈承接龙角与躯干，细碎金光顺着鳞身缓缓流淌，勾勒出东方青龙挺拔完整的身形。这条首尾贯通、上下相连的龙影，是历法为你的出生日期留下的传统日值意象。" },
  氐: { xiu: "氐", zheng: "土", animal: "貉", gong: "东", shou: "青龙", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为氐土貉。氐宿以土为七政，物象为貉，归东方青龙星宫。\n\n在传统四象意象中，氐星好比青龙稳固胸腹的基座，又似春日林下厚实沉静的沃土。貉穿行于低矮草木间，在枝叶与泥土之间踏出若隐若现的小径。这片贴近大地的东方画面，是历法为你的出生日期留下的记号。" },
  房: { xiu: "房", zheng: "日", animal: "兔", gong: "东", shou: "青龙", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为房日兔。房宿以日为七政，物象为兔，归东方青龙星宫。\n\n在传统四象意象中，房星如同青龙腹间一方敞亮天地，晨光洒满春日庭院，白兔静立花木丛中，静静聆听清晨细碎风声。融融日光与安然生灵相融，构成这一宿对应的传统日值意象。" },
  心: { xiu: "心", zheng: "月", animal: "狐", gong: "东", shou: "青龙", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为心月狐。心宿以月为七政，物象为狐，归东方青龙星宫。\n\n在传统四象意象中，清辉月色漫入春夜林地，狐影自密林深处缓步走出；青龙之心，是东方群星里一点澄澈微光。树影、月光与灵动兽影交叠，成为历法为你的出生日期留下的传统日值意象。" },
  尾: { xiu: "尾", zheng: "火", animal: "虎", gong: "东", shou: "青龙", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为尾火虎。尾宿以火为七政，物象为虎，归东方青龙星宫。\n\n在传统四象意象中，青龙长尾扫过东方层叠云霭，赤红火光在云隙间绵延铺开；虎沿着山脊从容前行，为静谧夜幕勾勒出鲜明轮廓。火光、山峦与龙尾相融，构成这一宿对应的传统日值意象。" },
  箕: { xiu: "箕", zheng: "水", animal: "豹", gong: "东", shou: "青龙", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为箕水豹。箕宿以水为七政，物象为豹，归东方青龙星宫。\n\n在传统四象意象中，箕星形似张开的簸箕，又像山谷收纳奔涌水汽。清泉穿行石缝，豹影掠过湿润林地，东方青龙七宿于此完成最后的舒展。这片水光流动的画面，是历法为你的出生日期留下的记号。" },
  斗: { xiu: "斗", zheng: "木", animal: "獬", gong: "北", shou: "玄武", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为斗木獬。斗宿以木为七政，物象为獬，归北方玄武星宫。\n\n在传统四象意象中，斗星宛若夜空之中的古老量具，苍木纹理在幽深北境慢慢铺展，獬静立于群星之间。暗沉天幕衬出清晰轮廓，形成沉静而富有层次的传统日值意象。" },
  牛: { xiu: "牛", zheng: "金", animal: "牛", gong: "北", shou: "玄武", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为牛金牛。牛宿以金为七政，物象为牛，归北方玄武星宫。\n\n在传统四象意象中，寒夜原野空旷宁静，牛伫立在薄霜与微光之间，金色星芒顺着脊背次第铺开。北方玄武深邃的底色包裹这片安稳辽阔的景致，成为历法为你的出生日期留下的传统日值意象。" },
  女: { xiu: "女", zheng: "土", animal: "蝠", gong: "北", shou: "玄武", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为女土蝠。女宿以土为七政，物象为蝠，归北方玄武星宫。\n\n在传统四象意象中，夜幕笼罩乡野屋舍，土墙留存白日余温，蝠自屋檐下轻轻掠过。不惊扰沉静大地，只在北方夜色留下一道轻盈弧线。大地、屋宇与夜行生灵，共同构成这一宿对应的传统画面。" },
  虚: { xiu: "虚", zheng: "日", animal: "鼠", gong: "北", shou: "玄武", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为虚日鼠。虚宿以日为七政，物象为鼠，归北方玄武星宫。\n\n在传统四象意象中，浅淡日光洒落空旷原野，石隙与仓廪边印下细碎足迹。鼠贴近地面悄然穿行，广阔天际留出大片静谧留白。暖阳与幽深北境相逢，形成这一宿对应的传统日值意象。" },
  危: { xiu: "危", zheng: "月", animal: "燕", gong: "北", shou: "玄武", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为危月燕。危宿以月为七政，物象为燕，归北方玄武星宫。\n\n在传统四象意象中，清冷月光洒向高台屋脊，燕影在夜色中划出灵动弧线。下方水面安然沉寂，远方天际空旷辽远，飞鸟轮廓在玄武意象中格外明晰。月下飞燕，是历法为你的出生日期留下的传统记号。" },
  室: { xiu: "室", zheng: "火", animal: "猪", gong: "北", shou: "玄武", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为室火猪。室宿以火为七政，物象为猪，归北方玄武星宫。\n\n在传统四象意象中，北方寒夜里的屋舍紧闭门窗，暖融融火光映亮梁柱土墙；猪安然卧于圈舍，屋外寒风被院墙阻隔。屋内灯火与安然生灵，组成这一宿对应的传统日值意象。" },
  壁: { xiu: "壁", zheng: "水", animal: "獝", gong: "北", shou: "玄武", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为壁水獝。壁宿以水为七政，物象为獝，归北方玄武星宫。\n\n在传统四象意象中，石壁沿着水岸连绵延展，水光漾开层层深浅纹路，古老獝兽静立于幽暗边际。崖壁、流水与玄武夜色彼此相融，形成深远静谧的传统日值意象。" },
  奎: { xiu: "奎", zheng: "木", animal: "狼", gong: "西", shou: "白虎", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为奎木狼。奎宿以木为七政，物象为狼，归西方白虎星宫。\n\n在传统四象意象中，夕阳垂落辽阔山野，林木慢慢化为剪影，狼的身影出现在远山山脊。西方清肃暮色与丛林相融，形成悠远清晰的传统日值意象。" },
  娄: { xiu: "娄", zheng: "金", animal: "狗", gong: "西", shou: "白虎", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为娄金狗。娄宿以金为七政，物象为狗，归西方白虎星宫。\n\n在传统四象意象中，暮色缓缓笼罩村落，鎏金余晖停驻门环与屋瓦，狗静守院前，眺望渐渐沉寂的长路。屋舍、柔光与守候的生灵，共同构成这一宿对应的传统日值意象。" },
  胃: { xiu: "胃", zheng: "土", animal: "彘", gong: "西", shou: "白虎", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为胃土彘。胃宿以土为七政，物象为彘，归西方白虎星宫。\n\n在传统四象意象中，秋日沃土收纳成熟谷物，粮仓与圈舍井然有序，彘安稳栖身厚重大地之间。西天余光慢慢收拢，田野、收成与生灵汇成充盈饱满的传统日值意象。" },
  昴: { xiu: "昴", zheng: "日", animal: "鸡", gong: "西", shou: "白虎", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为昴日鸡。昴宿以日为七政，物象为鸡，归西方白虎星宫。\n\n在传统四象意象中，破晓晨光越过院墙，鸡鸣自屋舍间四处传开，微光点亮羽翼与草叶上的晨露。白虎星宫清朗轮廓与清晨声息相逢，形成鲜活明亮的传统日值意象。" },
  毕: { xiu: "毕", zheng: "月", animal: "乌", gong: "西", shou: "白虎", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为毕月乌。毕宿以月为七政，物象为乌，归西方白虎星宫。\n\n在传统四象意象中，月光铺满秋日林地，乌栖于高高的枝头，远山与夜空界限分明。银辉月色、墨色飞鸟与连绵群山，共同构成这一宿对应的传统日值意象。" },
  觜: { xiu: "觜", zheng: "火", animal: "猴", gong: "西", shou: "白虎", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为觜火猴。觜宿以火为七政，物象为猴，归西方白虎星宫。\n\n在传统四象意象中，山间暮色尚未彻底沉落，暖火映照岩石枝桠，猴在林木间轻快穿梭。跃动火光与白虎清峻底色相互映衬，形成灵动鲜明的传统日值意象。" },
  参: { xiu: "参", zheng: "水", animal: "猿", gong: "西", shou: "白虎", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为参水猿。参宿以水为七政，物象为猿，归西方白虎星宫。\n\n在传统四象意象中，山泉奔涌穿过西方峡谷，猿栖于临水高枝，长臂与藤蔓在水面投下修长倒影。流水、岩壁与林间生灵，共同勾勒出历法为你的出生日期留下的传统日值意象。" },
  井: { xiu: "井", zheng: "木", animal: "犴", gong: "南", shou: "朱雀", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为井木犴。井宿以木为七政，物象为犴，归南方朱雀星宫。\n\n在传统四象意象中，古井藏于浓荫深处，木质井架横跨一汪清泉，古老犴兽静守石阶林木旁。朱雀明亮的霞光倒映井水之中，铺展出层层纵深的传统日值意象。" },
  鬼: { xiu: "鬼", zheng: "金", animal: "羊", gong: "南", shou: "朱雀", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为鬼金羊。鬼宿以金为七政，物象为羊，归南方朱雀星宫。\n\n在传统四象意象中，浅金色柔光漫过南方原野，羊群沿着缓坡缓步前行，铃声在草木间断断续续飘荡。朱雀暖色天穹与柔软羊影相融，织就温润辽阔的传统日值意象。" },
  柳: { xiu: "柳", zheng: "土", animal: "獐", gong: "南", shou: "朱雀", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为柳土獐。柳宿以土为七政，物象为獐，归南方朱雀星宫。\n\n在传统四象意象中，河岸柳条依依垂落，湿润泥土留下浅淡足印，獐自草木间探出身形，又悄然隐入林荫。南方水岸的柔和曲线与朱雀意象中的暖意相融，成为历法为你的出生日期留下的传统记号。" },
  星: { xiu: "星", zheng: "日", animal: "马", gong: "南", shou: "朱雀", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为星日马。星宿以日为七政，物象为马，归南方朱雀星宫。\n\n在传统四象意象中，炽日光华铺满无垠原野，马沿着明亮地平线向前驰骋，鬃毛与飞尘在光线里勾勒利落轮廓。朱雀舒展的南方天穹笼罩这片旷野，形成这一宿对应的传统日值意象。" },
  张: { xiu: "张", zheng: "月", animal: "鹿", gong: "南", shou: "朱雀", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为张月鹿。张宿以月为七政，物象为鹿，归南方朱雀星宫。\n\n在传统四象意象中，月色倾泻宽阔林地，鹿静立草地与树影交界之处，如云霞般舒展的云层横贯南方夜空。月光、鹿影与广袤天幕，共同形成柔和完整的传统日值意象。" },
  翼: { xiu: "翼", zheng: "火", animal: "蛇", gong: "南", shou: "朱雀", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为翼火蛇。翼宿以火为七政，物象为蛇，归南方朱雀星宫。\n\n在传统四象意象中，赤红云霞向两侧延展，如同朱雀舒展双翼；蛇沿着温热岩面蜿蜒游走，在光影之间划出流畅曲线。羽翼、火光与绵长兽影交织，形成这一宿对应的传统日值意象。" },
  轸: { xiu: "轸", zheng: "水", animal: "蚓", gong: "南", shou: "朱雀", reviewStatus: "human_reviewed_approved", narrative: "你出生这天的日值为轸水蚓。轸宿以水为七政，物象为蚓，归南方朱雀星宫。\n\n在传统四象意象中，细雨浸润松软泥土，蚓在地底开拓细密通道，地表水纹向着远方缓缓扩散。朱雀收拢双翼，南方群星的流转止于这片温润大地，形成安静绵长的传统日值意象。" }
};

export function selectBaziXiuNarrative(
  facts: BaziBirthXiuFactsV1 | null
): BaziXiuNarrativeSelection {
  if (!facts) return { status: "not_available", reason: "facts_absent" };
  if (facts.certainty === "unavailable") return { status: "not_available", reason: "facts_unavailable" };
  if (!facts.xiu || !facts.zheng || !facts.animal || !facts.gong || !facts.shou) {
    return { status: "not_available", reason: "facts_incomplete" };
  }
  const entry = BAZI_XIU_NARRATIVE_CATALOG[facts.xiu];
  if (!entry || entry.reviewStatus !== "human_reviewed_approved") {
    return { status: "not_available", reason: "narrative_unreviewed" };
  }
  if (
    entry.zheng !== facts.zheng
    || entry.animal !== facts.animal
    || entry.gong !== facts.gong
    || entry.shou !== facts.shou
  ) {
    return { status: "not_available", reason: "facts_mismatch" };
  }
  return { status: "available", entry };
}

export function hasCompleteBaziXiuNarrativeCatalog() {
  return XIU_NAMES.every(xiu => BAZI_XIU_NARRATIVE_CATALOG[xiu]?.xiu === xiu);
}
