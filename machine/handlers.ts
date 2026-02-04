import { logger } from "#/lib/logger"
import { decideNextState } from "#/machine/next"
import { challengeWithRetry } from "#/states/challenge"
import { evaluateWithRetry } from "#/states/evaluate"
import { normalizeWithRetry } from "#/states/normalize"
import { generatePlan } from "#/states/plan"
import type { AgentContext, AgentState } from "./types"

type StateHandler = (ctx: AgentContext) => Promise<AgentState>

export const handlers: Record<AgentState, StateHandler> = {
  IDLE: async () => "INGEST",

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
    const result = await evaluateWithRetry(ctx)

    if (!result.ok) {
      ctx.errors = [result.error.message]
      return "FAILED"
    }

    ctx.evaluation = result.data
    return "CHALLENGE"
  },

  CHALLENGE: async ctx => {
    const result = await challengeWithRetry(ctx)

    if (!result.ok) {
      ctx.errors = [result.error.message]
      return "FAILED"
    }

    ctx.risks = result.data
    return "DECIDE"
  },

  DECIDE: async ctx => {
    const decision = decideNextState(ctx)
    ctx.questions = decision.questions
    return decision.nextState
  },

  WAIT_FOR_HUMAN: async () => {
    // stop execution here
    return "WAIT_FOR_HUMAN"
  },

  PLAN: async ctx => {
    ctx.plan = await generatePlan(ctx)
    return "DONE"
  },

  DONE: async () => {
    return Promise.reject()
  },

  FAILED: async () => {
    return "FAILED"
  },
}
