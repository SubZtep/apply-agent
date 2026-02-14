import z from "zod"

export const BatchScoreSchema = z.object({
  score: z.number().min(0).max(1),
  signals: z.array(z.string().min(1)).min(1).max(5),
  redFlags: z.array(z.string()).max(3),
})

export type BatchScore = z.infer<typeof BatchScoreSchema>
