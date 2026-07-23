import { z } from "zod";

export const signQuestionSchema = z.string()
  .trim()
  .min(2, "请再多说一点你的实际处境")
  .max(800, "问题请控制在800字以内");

export const startSignInterpretationSchema = z.object({
  domainCode: z.enum([
    "self_state",
    "career_study",
    "relationship",
    "family",
    "cooperation",
    "choice_timing",
    "custom"
  ]),
  question: signQuestionSchema
}).strict();

export const continueSignInterpretationSchema = z.object({
  message: signQuestionSchema
}).strict();

export const drawSignRequestSchema = z.object({}).strict();
