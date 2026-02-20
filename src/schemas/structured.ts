import { z } from "zod"

export const ScoringJobOutputSchema = z.object({
  strongMatches: z.array(z.string().min(1)),
  partialMatches: z.array(z.string().min(1)),
  domainMatch: z.boolean(),
  seniorityMatch: z.boolean(),
  majorMissingSkills: z.array(z.string().min(1)),
  domainMismatch: z.boolean(),
  seniorityMismatch: z.boolean()
})

export type ScoringJobOutput = z.infer<typeof ScoringJobOutputSchema>
