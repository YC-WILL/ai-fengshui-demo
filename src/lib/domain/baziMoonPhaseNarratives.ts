import {
  MOON_PHASE_NAMES,
  type BaziBirthMoonPhaseFactsV1,
  type MoonPhaseName
} from "./baziBirthMoonPhaseFacts";

export type BaziMoonPhaseNarrativeReviewStatus = "human_reviewed_approved";

export interface BaziMoonPhaseNarrativeEntry {
  phase: MoonPhaseName;
  label: string;
  reviewStatus: BaziMoonPhaseNarrativeReviewStatus;
  narrative: string;
}

export type BaziMoonPhaseNarrativeSelection =
  | {
      status: "available";
      entry: BaziMoonPhaseNarrativeEntry;
      moonAgeDays: number;
      elongationDegrees: number;
    }
  | {
      status: "not_available";
      reason:
        | "facts_absent"
        | "facts_uncertain"
        | "facts_unavailable"
        | "facts_incomplete"
        | "narrative_unreviewed";
    };

export const BAZI_MOON_PHASE_NARRATIVE_CATALOG: Record<
  MoonPhaseName,
  BaziMoonPhaseNarrativeEntry
> = {
  new_moon: {
    phase: "new_moon",
    label: "朔",
    reviewStatus: "human_reviewed_approved",
    narrative: "你出生时，月亮与太阳运行到相近的方向，月亮被照亮的一面大多背向大地，夜空中几乎看不见它的轮廓。\n\n此刻的月光收拢在黑暗之中，一轮旧的盈亏已经结束，新的月相循环正从寂静里重新开始。\n\n这片几乎不见月光的夜空，也成为你生命开始时最初的月亮印记。"
  },
  waxing_crescent: {
    phase: "waxing_crescent",
    label: "盈眉月",
    reviewStatus: "human_reviewed_approved",
    narrative: "你出生时，月亮刚刚离开朔的位置，一弯纤细月光出现在天空。明亮部分仍然不多，却在接下来的夜晚持续增长。\n\n它像黑暗中轻轻展开的一道银色弧线，月亮正在一点点显露自己的形状，夜空也由此重新拥有光亮。\n\n这弯刚刚显露的银光，正是你来到世界时，天空留下的出生剪影。"
  },
  first_quarter: {
    phase: "first_quarter",
    label: "上弦月",
    reviewStatus: "human_reviewed_approved",
    narrative: "你出生时，月亮已经走过约四分之一轮盈亏循环，面向大地的明亮部分接近一半，光与暗在月面上清楚相接。\n\n半轮月亮悬在夜空，一侧明亮，一侧隐入阴影。它停留在圆缺之间，让增长中的月光拥有清晰轮廓。\n\n这道明暗各半的月面，成为天空为你生命开端保存的一枚清晰刻度。"
  },
  waxing_gibbous: {
    phase: "waxing_gibbous",
    label: "盈凸月",
    reviewStatus: "human_reviewed_approved",
    narrative: "你出生时，月亮的明亮部分已经超过一半，并继续朝着望月靠近。夜晚的月光逐渐充盈，月面只剩下一小部分藏在阴影里。\n\n此刻的月亮已经显出接近圆满的形态，光芒一夜比一夜完整，安静照亮越来越广阔的天空。\n\n这轮趋近圆满的月光，就此定格为你出生之夜的天幕印记。"
  },
  full_moon: {
    phase: "full_moon",
    label: "望",
    reviewStatus: "human_reviewed_approved",
    narrative: "你出生时，月亮运行到与太阳相对的方向，被照亮的一面朝向大地，月面呈现接近完整的圆形。\n\n圆月高悬，明亮光线铺向屋顶、树梢与水面。月亮在这一刻抵达本轮盈亏中最充盈的位置，随后开始走向另一半旅程。\n\n这片铺满天地的圆月清辉，成为你抵达世界时最明亮的天空背景。"
  },
  waning_gibbous: {
    phase: "waning_gibbous",
    label: "亏凸月",
    reviewStatus: "human_reviewed_approved",
    narrative: "你出生时，月亮已经越过望的位置，明亮部分依旧宽广，却开始逐夜减少。圆满的轮廓从一侧慢慢收起，月光进入回落阶段。\n\n它仍然能够照亮深夜，只是不再继续扩张。月亮带着曾经完整的光芒，平静走向下一次半明半暗。\n\n这轮由盛转静的月光，为你出生的那一夜留下宽广而安定的轮廓。"
  },
  last_quarter: {
    phase: "last_quarter",
    label: "下弦月",
    reviewStatus: "human_reviewed_approved",
    narrative: "你出生时，月亮已经走过约四分之三轮盈亏循环，面向大地的明亮部分再次接近一半。\n\n半轮月亮多在后半夜与清晨出现，光与暗重新形成清晰边界。夜色尚未完全退去，它已经陪伴天空走向黎明。\n\n这轮陪伴黎明的半月，成为你来到世界时夜与晨交接的天空记号。"
  },
  waning_crescent: {
    phase: "waning_crescent",
    label: "残月",
    reviewStatus: "human_reviewed_approved",
    narrative: "你出生时，本轮月相循环已经接近尾声。月亮只留下逐渐变细的一弯微光，多在天亮前短暂出现在东方天空。\n\n这道光安静收回夜色之中，轮廓一天比一天纤细。等最后一线月光隐去，月亮便会回到朔的位置，开始下一轮圆缺流转。\n\n这弯黎明前的微光，正是月亮为你出生时刻留下的最后一笔银色轮廓。"
  }
};

export function selectBaziMoonPhaseNarrative(
  facts: BaziBirthMoonPhaseFactsV1 | null
): BaziMoonPhaseNarrativeSelection {
  if (!facts) return { status: "not_available", reason: "facts_absent" };
  if (facts.certainty === "uncertain") {
    return { status: "not_available", reason: "facts_uncertain" };
  }
  if (facts.certainty === "unavailable") {
    return { status: "not_available", reason: "facts_unavailable" };
  }
  if (
    !facts.phase
    || !Number.isFinite(facts.moonAgeDays)
    || !Number.isFinite(facts.elongationDegrees)
  ) {
    return { status: "not_available", reason: "facts_incomplete" };
  }

  const entry = BAZI_MOON_PHASE_NARRATIVE_CATALOG[facts.phase];
  if (!entry || entry.reviewStatus !== "human_reviewed_approved") {
    return { status: "not_available", reason: "narrative_unreviewed" };
  }

  return {
    status: "available",
    entry,
    moonAgeDays: facts.moonAgeDays!,
    elongationDegrees: facts.elongationDegrees!
  };
}

export function hasCompleteBaziMoonPhaseNarrativeCatalog() {
  return MOON_PHASE_NAMES.every(phase => (
    BAZI_MOON_PHASE_NARRATIVE_CATALOG[phase]?.phase === phase
  ));
}
