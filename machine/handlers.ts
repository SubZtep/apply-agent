import type { AgentContext, AgentState } from ".."
import { challengeAssessment } from "../states/challenge"
import { evaluateMatch } from "../states/evaluate"
import { normalizeJob } from "../states/normalize"
import { generatePlan } from "../states/plan"
import { decideNextState } from "./next"

export type StateHandler = (ctx: AgentContext) => Promise<AgentState>

export const handlers: Record<AgentState, StateHandler> = {
  IDLE: async _ctx => "INGEST",

  INGEST: async ctx => {
    if (!ctx.jobText || !ctx.profileText) {
      console.error("Missing input")
      return "FAILED"
    }
    return "NORMALIZE"
  },

  NORMALIZE: async ctx => {
    ctx.job = await normalizeJob(ctx.jobText!)
    return "EVALUATE"
  },

  EVALUATE: async ctx => {
    ctx.evaluation = await evaluateMatch(ctx.job!, ctx.profileText!)
    return "CHALLENGE"
  },

  CHALLENGE: async ctx => {
    ctx.risks = await challengeAssessment(ctx)
    return "DECIDE"
  },

  DECIDE: async ctx => {
    const decision = decideNextState(ctx)
    ctx.questions = decision.questions
    return decision.nextState
  },

  WAIT_FOR_HUMAN: async _ctx => {
    // stop execution here
    return "WAIT_FOR_HUMAN"
  },

  PLAN: async ctx => {
    ctx.plan = await generatePlan(ctx)
    return "DONE"
  },

  DONE: async () => "DONE",

  FAILED: async () => {
    console.error("Agent failed")
    return "FAILED"
  },
}
