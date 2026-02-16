import z from "zod"
import type { AgentQuestion, AgentState } from "#/machine/types"
import type { Evaluation } from "./evalution"
import type { RiskAssessment } from "./risk"

export const ScoreSchema = z.object({
  score: z.number().min(0).max(1),
  signals: z.array(z.string().min(1)).min(1).max(5),
  redFlags: z.array(z.string()).max(3)
})

export const JobSchema = z.object({
  job: z.object({
    id: z.string().min(1),
    source: z.string(),
    url: z.url(),
    title: z.string().min(1),
    description: z.string(),
    company: z.string(),
    location: z.string()
  }),
  batch: ScoreSchema.optional()
})

export const JobSpecSchema = z.object({
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  senioritySignals: z.array(z.string())
})

export type Job = z.infer<typeof JobSchema>
export type JobSpec = z.infer<typeof JobSpecSchema>
export type Score = z.infer<typeof ScoreSchema>

// export interface Batch {
//   score: number
//   signals: string[]
//   redFlags: string[]
// }

export interface JobAgent {
  mode: "strict" | "exploratory"
  state: AgentState
  evaluation?: Evaluation
  risks?: RiskAssessment

  // human loop
  questions?: AgentQuestion[]
  humanInput?: {
    answers?: Record<string, string>
    forceProceed?: boolean
  }
}

// export interface Job {
//   job: {
//     id: string
//     source: string
//     title: string
//     company: string
//     description: string
//     url: string
//     location: string
//   } & Partial<JobSpec>
//   batch?:
//   agent?: JobAgent
//   // agent?: {
//   //   mode: "strict" | "exploratory"
//   //   state: AgentState
//   //   evaluation?: Evaluation
//   //   risks?: RiskAssessment

//   //   // human loop
//   //   questions?: AgentQuestion[]
//   //   humanInput?: {
//   //     answers?: Record<string, string>
//   //     forceProceed?: boolean
//   //   }
//   // }
//   plan?: ActionPlan
// }
