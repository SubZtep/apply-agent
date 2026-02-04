import z from "zod"

export const JobSpecSchema = z.object({
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  senioritySignals: z.array(z.string()),
})

export type JobSpec = z.infer<typeof JobSpecSchema>

export interface Job {
  job: {
    id: string
    source: string
    title: string
    company: string
    description: string
    url: string
    location: string
  }
  batch?: {
    score: number
    signals: string[]
    redFlags: string[]
    scoredAt: string
    model: string
  }
  agent?: null
}
