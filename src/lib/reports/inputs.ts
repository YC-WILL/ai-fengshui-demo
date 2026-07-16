// ============================================================
// 报告输入 Zod schemas
// ============================================================

import { z } from "zod";

export const baziInputSchema = z.object({
  gender: z.enum(["male", "female", "other"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "出生日期格式应为 YYYY-MM-DD"),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, "出生时间格式应为 HH:mm").optional().or(z.literal("")),
  birthLocation: z.string().max(120).optional(),
  unknownTime: z.boolean().optional(),
  userContext: z.string().max(500).optional()
});

export const baziGenerateSchema = z.object({
  tier: z.enum(["basic", "deep"]),
  input: baziInputSchema
});

export const marriageGenerateSchema = z.object({
  tier: z.enum(["basic", "deep"]),
  input: z.object({
    partyA: baziInputSchema,
    partyB: baziInputSchema,
    relationshipStage: z.enum(["dating", "engaged", "married", "considering"]).optional(),
    notes: z.string().max(500).optional()
  })
});

export const fengshuiGenerateSchema = z.object({
  tier: z.enum(["basic", "deep"]),
  input: z.object({
    orientation: z.string().min(1).max(10),
    layout: z.string().max(500),
    rooms: z.array(z.object({
      name: z.string().min(1).max(20),
      note: z.string().max(200).optional()
    })).min(1).max(10),
    primaryConcerns: z.string().max(500).optional(),
    floorPlanText: z.string().max(2000).optional()
  })
});

export const dateSelectionGenerateSchema = z.object({
  tier: z.enum(["basic", "deep"]),
  input: z.object({
    event: z.enum(["wedding", "moving", "opening", "signing", "travel", "renovation_start"]),
    dateRangeStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dateRangeEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    user: baziInputSchema,
    notes: z.string().max(300).optional()
  })
});
