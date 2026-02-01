import { z } from "zod"

const testData: JobSpec = {
  skills: [],
  responsibilities: [],
  senioritySignals: ["leadership"],
}

const JobSpec = z.object({
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  senioritySignals: z.array(z.string()),
})

export type JobSpec = z.infer<typeof JobSpec>

export function normalizeJob(_jobText?: string) {
  return Promise.resolve(JobSpec.parse(testData))
}
