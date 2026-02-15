import z from "zod"
import type { ActionPlan } from "#/machine/states/plan"
import type { AgentQuestion, AgentState } from "#/machine/types"
import type { Evaluation } from "./evalution"
import type { RiskAssessment } from "./risk"

export const JobSpecSchema = z.object({
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  senioritySignals: z.array(z.string())
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
  } & Partial<JobSpec>
  batch?: {
    score: number
    signals: string[]
    redFlags: string[]
  }
  agent?: {
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
  plan?: ActionPlan
}
