import { join } from "node:path"
import { runAgent } from "./machine/run"
import type { RiskAssessment } from "./states/challenge"
import type { Evaluation } from "./states/evaluate"
import type { JobSpec } from "./states/normalize"
import type { ActionPlan } from "./states/plan"

export type AgentState =
  | "IDLE"
  | "INGEST"
  | "NORMALIZE"
  | "EVALUATE"
  | "CHALLENGE"
  | "DECIDE"
  | "WAIT_FOR_HUMAN"
  | "PLAN"
  | "DONE"
  | "FAILED"

interface HumanDecision {
  forceProceed?: boolean
  interpretAsBestCase?: boolean
}

export interface AgentContext {
  mode: "strict" | "exploratory"
  state: AgentState

  // raw inputs
  jobText?: string
  profileText?: string

  // normalized data
  job?: JobSpec

  // evaluation results
  evaluation?: Evaluation

  // challenge phase output
  risks?: RiskAssessment

  questions?: string[]

  // human feedback
  humanInput?: HumanDecision

  // final output
  plan?: ActionPlan

  // meta
  errors?: string[]
}

const ctx: AgentContext = {
  mode: "strict",
  state: "IDLE",
  jobText: await Bun.file(join(import.meta.dirname, "data", "job.txt")).text(),
  profileText: await Bun.file(join(import.meta.dirname, "data", "cv.txt")).text(),
}

await runAgent(ctx)
