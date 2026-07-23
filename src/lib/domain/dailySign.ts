export type SignPeriod = "morning" | "noon" | "afternoon" | "evening";

export interface DailySign {
  id: string;
  word: string;
  message: string;
}

interface SignTheme {
  word: string;
  messages: readonly [string, string];
}

export const SIGN_PERIOD_LABEL: Record<SignPeriod, string> = {
  morning: "早签",
  noon: "午签",
  afternoon: "下午签",
  evening: "晚签"
};

export const SIGN_TIMEZONE = "Asia/Shanghai";

const SIGN_LIBRARY: Record<SignPeriod, readonly SignTheme[]> = {
  morning: [
    { word: "新启", messages: ["愿你带着一点轻松重新出发，今天先走好眼前这一小步。", "新的一天不必急着证明什么，愿你从一件喜欢的小事慢慢开始。"] },
    { word: "向阳", messages: ["愿你把目光放回正在变好的地方，心里有光，脚下也会从容一些。", "即使清晨还有薄雾，也愿你循着亮处，慢慢找到今天的方向。"] },
    { word: "明朗", messages: ["愿今天的事情一件件清楚起来，不慌不忙，也不为难自己。", "愿你看清真正重要的事，把其余纷扰轻轻放到一旁。"] },
    { word: "顺意", messages: ["愿你尊重自己的节奏，在能做的地方用心，在不能控制的地方放松。", "愿今天多几分合心意的安排，也给临时变化留一点温柔的余地。"] },
    { word: "欣然", messages: ["愿你带着愿意尝试的心迎接今天，不因结果未定就错过眼前的体验。", "愿你欣然接住今天的小惊喜，也平静面对偶尔的不如意。"] },
    { word: "舒展", messages: ["愿身体和思绪都慢慢舒展开，不被匆忙推着向前。", "愿你先松一松肩膀，再选择今天真正值得用心的一件事。"] },
    { word: "有光", messages: ["愿你看见自己已经拥有的微光，也把一点暖意带给身边的人。", "不必等一切都清楚才出发，愿眼前这一点光陪你多走几步。"] },
    { word: "清新", messages: ["愿今天少一点旧日的牵绊，多一点重新整理生活的清新感。", "愿你给房间和心情都透透气，让新的感受自然进来。"] },
    { word: "得宜", messages: ["愿你今天做事轻重得宜，既认真投入，也记得照顾自己。", "愿每一份用心都有合适的位置，不多耗一分，也不少留遗憾。"] },
    { word: "开怀", messages: ["愿今天有一件小事让你真心笑起来，把紧绷的心轻轻打开。", "愿你不吝啬自己的笑意，也不勉强自己时时保持快乐。"] },
    { word: "朝气", messages: ["愿你把清晨的精神留给最重要的事，带着活力，也带着分寸。", "愿今天有一点想动起来的力量，不求很快，只求真实地开始。"] },
    { word: "进益", messages: ["愿你今天比昨天多懂一点、多走一步，小小积累也值得欢喜。", "愿你的认真慢慢成为自己的底气，进步不必喧闹，也自有分量。"] }
  ],
  noon: [
    { word: "安好", messages: ["走了半天，愿你先照顾好自己，好好吃饭，也好好喘口气。", "愿此刻的你身体安稳、心里安好，不用急着盘点上午的得失。"] },
    { word: "顺心", messages: ["愿接下来的安排更合心意，即使偶有变化，也能温柔应对。", "愿你听见心里真实的需要，不勉强，也不忽略自己。"] },
    { word: "清和", messages: ["愿午间有一段清静温和的时光，让纷乱的思绪慢慢沉下来。", "愿你以平和的心接住今天，不急着评判，也不急着回答。"] },
    { word: "从容", messages: ["愿你吃好这一餐，再从容走进下午，不被催促打乱自己的步子。", "事情可以一件件来，愿你心里有序，手上不慌。"] },
    { word: "舒心", messages: ["愿这一刻少些牵挂，多些舒心，给自己一段不被打扰的时间。", "愿你放松紧绷了一上午的心，让舒服也成为今天重要的事情。"] },
    { word: "得闲", messages: ["愿你从忙碌里偷得片刻清闲，什么都不完成也没有关系。", "愿午间留下一点属于自己的空白，让精神慢慢回来。"] },
    { word: "和缓", messages: ["愿语气和缓、脚步和缓，也愿你不把压力都留给自己。", "当事情走得太快，愿你允许自己慢一点，再慢一点。"] },
    { word: "添力", messages: ["愿一顿饭、一次休息，为你添回继续生活的力气。", "愿你先补充自己，再处理事情；照顾好精力，才走得更稳。"] },
    { word: "有余", messages: ["愿你的时间有余、心里有余，不把今天安排得密不透风。", "愿你做事留一点回转的空间，也给自己留一点呼吸的位置。"] },
    { word: "合意", messages: ["愿下午有几件合心意的小事，也愿你有勇气推开不合适的安排。", "愿你按照真实需要做选择，不必为了迎合而耗尽自己。"] },
    { word: "暖意", messages: ["愿一顿热饭、一句问候，为今天添上一点实实在在的暖意。", "愿你留意身边细小的温暖，也记得把这份温暖送给自己。"] },
    { word: "松快", messages: ["愿午间的停顿让身心松快一些，下午不必背着上午的疲惫赶路。", "愿你暂时放下手里的事，让肩膀和眉头都松一松。"] }
  ],
  afternoon: [
    { word: "渐成", messages: ["愿你的认真慢慢成形，不因暂时看不到结果，就否定走过的路。", "有些收获需要时间，愿你把重要的事再安稳推进一小步。"] },
    { word: "稳进", messages: ["愿你不被下午的匆忙催赶，稳稳推进，也保留调整方向的余地。", "愿每一步都落在实处，不追求很快，只求走得踏实。"] },
    { word: "得力", messages: ["愿你找到顺手的方法，也愿需要的时候，有人愿意搭一把手。", "愿今天的经验成为你的助力，让接下来的事情省一点心。"] },
    { word: "顺手", messages: ["愿手边的事情渐渐顺起来，从最容易完成的一件开始就好。", "愿你少一点来回消耗，多一点自然流畅的推进。"] },
    { word: "有成", messages: ["愿今天的付出留下看得见的小成果，哪怕只是完成了一部分。", "愿你看见已经做成的事，不只盯着尚未完成的部分。"] },
    { word: "圆融", messages: ["愿你表达自己的想法，也听见别人的难处，让事情有商量的空间。", "愿坚定与温和同时留在你身上，不委屈自己，也不为难别人。"] },
    { word: "和合", messages: ["愿人与事找到更舒服的配合，不求完全相同，只求愿意彼此靠近。", "愿今天的一次好好沟通，让不同的想法慢慢走到一起。"] },
    { word: "相宜", messages: ["愿你把精力放在此刻相宜的事情上，不必什么都抓在手里。", "愿合适的人做合适的事，也愿你不再独自承担所有重量。"] },
    { word: "丰盈", messages: ["愿你看见今天已有的收获，一点经验、一份理解，都让生活更丰盈。", "愿忙碌不只留下疲惫，也留下值得记住的小小满足。"] },
    { word: "如愿", messages: ["愿你认真对待能够改变的部分，也放松面对暂时不能控制的结果。", "愿心里的期待被温柔照见，今天先为它做一件力所能及的小事。"] },
    { word: "见喜", messages: ["愿你在寻常下午遇见一点欢喜，也有心情把它好好收下。", "愿一条消息、一次完成或一阵好风，给今天添一点轻快。"] },
    { word: "顺遂", messages: ["愿接下来的事情少些阻滞；若有变化，也愿你从容找到新的走法。", "愿你在自己的节奏里把事情慢慢做好，不慌张，也不勉强。"] }
  ],
  evening: [
    { word: "心安", messages: ["愿白天的纷扰慢慢退去，今晚的你能够把心安顿回来。", "愿你不再反复责备自己，已经认真走过今天，就值得安心。"] },
    { word: "归安", messages: ["愿忙碌留在门外，回到自己的空间，也回到自己的节奏。", "愿你把没有完成的事交给明天，让今天在此刻安稳收尾。"] },
    { word: "安宁", messages: ["愿夜色带来安宁，让声音慢下来，也让心里的波澜慢慢平复。", "愿今晚少些打扰，多些安静，好好陪自己待一会儿。"] },
    { word: "静好", messages: ["愿你珍惜眼前平常而安静的片刻，不必追赶，也不必证明。", "愿一盏灯、一杯水和一段闲坐，让今晚变得简单而静好。"] },
    { word: "好梦", messages: ["愿今天的疲惫停在枕边，睡意到来时，心里不再挂着太多事情。", "愿你带着一点满足入睡，把新的精神留给明天。"] },
    { word: "温暖", messages: ["愿今晚有人惦记，也愿你知道怎样给自己一份踏实的温暖。", "愿一顿热饭、一句关心或一个拥抱，轻轻接住今天的你。"] },
    { word: "和乐", messages: ["愿晚间的相处少些要求，多些轻松，让彼此都能自在一点。", "愿你与在意的人好好说话，也共享一点平凡的快乐。"] },
    { word: "欢喜", messages: ["愿你记起今天值得欢喜的一件小事，让它成为入夜后的微光。", "愿快乐无需盛大，一点好吃的、一句好话，也能被你好好感受。"] },
    { word: "圆满", messages: ["愿你看见今天已经完成的部分，不用事事完美，也可以安心收尾。", "愿遗憾留一点余地，收获被认真看见，这一天便有自己的圆满。"] },
    { word: "安睡", messages: ["愿你放下还在转动的念头，让身体先得到一晚诚实的休息。", "愿睡前不再处理太多问题，把答案交给更有精神的明天。"] },
    { word: "宁心", messages: ["愿你把注意力从外面的声音收回来，听一听此刻真正的感受。", "愿呼吸慢一点，灯光柔一点，让心也跟着安静一点。"] },
    { word: "柔光", messages: ["愿今晚的一点柔光照着你，也照着那些还没有想明白的事情。", "不必急着驱散所有迷茫，愿温柔的光陪你安静待一会儿。"] }
  ]
};

export function getSignPeriod(date: Date, timezone = SIGN_TIMEZONE): SignPeriod {
  const { hour } = signTimeParts(date, timezone);
  if (hour >= 6 && hour <= 10) return "morning";
  if (hour >= 11 && hour <= 12) return "noon";
  if (hour >= 13 && hour <= 16) return "afternoon";
  return "evening";
}

export function getSignDateKey(date: Date, timezone = SIGN_TIMEZONE): string {
  const parts = signTimeParts(date, timezone);
  const localDateKey = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  return parts.hour < 6 ? offsetDateKey(localDateKey, -1) : localDateKey;
}

export function resolveSignMoment(date: Date, timezone = SIGN_TIMEZONE) {
  const period = getSignPeriod(date, timezone);
  return {
    period,
    periodLabel: SIGN_PERIOD_LABEL[period],
    signDate: getSignDateKey(date, timezone),
    timezone
  };
}

export function getSignCandidates(period: SignPeriod): DailySign[] {
  return SIGN_LIBRARY[period].flatMap((theme, themeIndex) =>
    theme.messages.map((message, messageIndex) => ({
      id: `${period}-${themeIndex}-${messageIndex}`,
      word: theme.word,
      message
    }))
  );
}

export function pickSignCandidate(
  period: SignPeriod,
  recentIds: readonly string[] = [],
  random: () => number = secureRandomFraction
): DailySign {
  const candidates = getSignCandidates(period);
  const recentWords = new Set(
    recentIds.slice(0, 6).map(id => candidates.find(candidate => candidate.id === id)?.word).filter(Boolean)
  );
  let available = candidates.filter(candidate =>
    !recentIds.includes(candidate.id) && !recentWords.has(candidate.word)
  );
  if (available.length === 0) {
    available = candidates.filter(candidate => !recentIds.includes(candidate.id));
  }
  if (available.length === 0) available = candidates;
  const value = Math.max(0, Math.min(0.999999999, random()));
  return available[Math.floor(value * available.length)];
}

function signTimeParts(date: Date, timezone: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, Number(part.value)])
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour
  };
}

function offsetDateKey(dateKey: string, offset: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function secureRandomFraction() {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0] / 0x1_0000_0000;
}
