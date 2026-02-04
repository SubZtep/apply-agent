import z from "zod"

export const RiskAssessmentSchema = z.object({
  hardGaps: z.array(z.string().min(1)).max(5),
  softGaps: z.array(z.string().min(1)).max(5),
  mitigations: z.array(z.string().min(1)).max(5),
})

export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>
