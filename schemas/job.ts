import z from "zod"
import type { AgentState } from "#/machine/types"

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
    profileText: string // belongs to a job, profile can be optimized for the job
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
  // agent?: null

  // ---- agent context (this replaces PersistedAgent) ----
  agent?: {
    mode: "strict" | "exploratory"
    state: AgentState

    // // inputs
    /////// profileText: string;

    // derived artifacts
    /////////// normalized?: NormalizedJob;
    evaluation?: EvaluationResult
    risks?: RiskAssessment

    // human loop
    questions?: AgentQuestion[]
    humanInput?: {
      answers: Record<string, string>
      forceProceed?: boolean
    }

    //////// // bookkeeping
    //////// history?: AgentEvent[]
    //////// lastModel?: string
  }
}
