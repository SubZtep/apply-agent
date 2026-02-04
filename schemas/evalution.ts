import z from "zod"

export const EvaluationSchema = z.object({
  requirements: z
    .array(
      z.object({
        requirement: z.string().min(1),
        confidence: z.number().min(0).max(1),
        evidence: z.string().min(1),
      }),
    )
    .min(1),
})

export type Evaluation = z.infer<typeof EvaluationSchema>
