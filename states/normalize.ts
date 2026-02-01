import { z } from "zod"
import { normalise } from "../ai/normalise"

const JobSpec = z.object({
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  senioritySignals: z.array(z.string()),
})

export type JobSpec = z.infer<typeof JobSpec>

export async function normalizeJob(jobText: string) {
  const job = await normalise(jobText)
  return Promise.resolve(JobSpec.parse(job))
}
