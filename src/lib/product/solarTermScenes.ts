export const SOLAR_TERM_SCENES = [
  { name: "立春", crop: [10, 68, 244, 247], note: "东风解冻，春意从细处萌发" },
  { name: "雨水", crop: [260, 68, 246, 247], note: "雨水渐多，草木开始舒展" },
  { name: "惊蛰", crop: [511, 68, 251, 247], note: "春雷初动，蛰伏的生机醒来" },
  { name: "春分", crop: [768, 68, 251, 247], note: "昼夜均分，春色正到中段" },
  { name: "清明", crop: [1025, 68, 246, 247], note: "气清景明，万物显出新绿" },
  { name: "谷雨", crop: [1277, 68, 248, 247], note: "雨生百谷，暮春继续生长" },
  { name: "立夏", crop: [10, 321, 244, 223], note: "夏意初立，草木进入繁盛" },
  { name: "小满", crop: [260, 321, 246, 223], note: "物至小满，丰盈尚留余地" },
  { name: "芒种", crop: [511, 321, 251, 223], note: "有芒之谷，忙中自有次序" },
  { name: "夏至", crop: [768, 321, 251, 223], note: "白昼最长，盛夏由此展开" },
  { name: "小暑", crop: [1025, 321, 246, 223], note: "暑气渐盛，荷风带来清意" },
  { name: "大暑", crop: [1277, 321, 248, 223], note: "暑热至盛，万物蓄养成熟" },
  { name: "立秋", crop: [10, 550, 244, 214], note: "秋意初立，暑热尚未全退" },
  { name: "处暑", crop: [260, 550, 246, 214], note: "暑气渐止，天地慢慢转凉" },
  { name: "白露", crop: [511, 550, 251, 214], note: "露凝而白，早晚已有凉意" },
  { name: "秋分", crop: [768, 550, 251, 214], note: "昼夜再度均分，秋色正中" },
  { name: "寒露", crop: [1025, 550, 246, 214], note: "露气转寒，深秋层次渐浓" },
  { name: "霜降", crop: [1277, 550, 248, 214], note: "霜始凝结，草木准备收藏" },
  { name: "立冬", crop: [10, 770, 244, 228], note: "冬意初立，万物转入收藏" },
  { name: "小雪", crop: [260, 770, 246, 228], note: "寒意渐深，初雪轻落山野" },
  { name: "大雪", crop: [511, 770, 251, 228], note: "雪意渐盛，天地归于沉静" },
  { name: "冬至", crop: [768, 770, 251, 228], note: "夜长至极，新的阳气初生" },
  { name: "小寒", crop: [1025, 770, 246, 228], note: "寒气积久，梅枝静候春信" },
  { name: "大寒", crop: [1277, 770, 248, 228], note: "严寒至深，岁序将启新章" }
] as const;

export type SolarTermSceneName = typeof SOLAR_TERM_SCENES[number]["name"];

export function solarTermScene(name: string) {
  return SOLAR_TERM_SCENES.find(scene => scene.name === name) ?? SOLAR_TERM_SCENES[0];
}
