import { z } from "zod"

export const JobSpec = z.object({
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  senioritySignals: z.array(z.string()),
  keywords: z.array(z.string()),
})

export type JobSpec = z.infer<typeof JobSpec>
