import type { AgentContext, AgentState } from ".."
import { normalizeWithRetry } from "../ai/normalize"
import { logger } from "../logger"
import { challengeAssessment } from "../states/challenge"
import { evaluateMatch } from "../states/evaluate"
import { generatePlan } from "../states/plan"
import { decideNextState } from "./next"

export type StateHandler = (ctx: AgentContext) => Promise<AgentState>

export const handlers: Record<AgentState, StateHandler> = {
  IDLE: async _ctx => "INGEST",

  INGEST: async ctx => {
    if (!ctx.jobText || !ctx.profileText) {
      logger.error(ctx, "Missing input")
      return "FAILED"
    }
    return "NORMALIZE"
  },

  NORMALIZE: async ctx => {
    const result = await normalizeWithRetry(ctx.jobText!)

    if (!result.ok) {
      ctx.errors = [result.error.message]
      return "FAILED"
    }

    ctx.job = result.data
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
    logger.error("Agent failed")
    return "FAILED"
  },
}
