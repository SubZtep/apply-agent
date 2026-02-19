import { logger } from "#/lib/logger"
import { decideNextState } from "#/machine/next"
import { challengeWithRetry } from "#/machine/states/challenge"
import { evaluateWithRetry } from "#/machine/states/evaluate"
import { normalizeWithRetry } from "#/machine/states/normalize"
import { generatePlan } from "#/machine/states/plan"
import type { AgentState, Job } from "#/schemas/job"

type StateHandler = (ctx: Job) => Promise<AgentState>

export const handlers: Record<AgentState, StateHandler> = {
  // FIXME: should add errors to the job.agent?
  IDLE: async () => "INGEST",

  INGEST: async job => {
    if (!job.job.description || !job.job.description) {
      // logger.error(job, "Missing input")
      return "FAILED"
    }
    return "NORMALIZE"
  },

  NORMALIZE: async job => {
    const result = await normalizeWithRetry(job.job.description)

    if (!result.ok) {
      logger.error(job, result.error.message)
      return "FAILED"
    }

    job.job = {
      ...job.job,
      ...result.data
    }
    return "EVALUATE"
  },

  EVALUATE: async job => {
    const result = await evaluateWithRetry(job)
    job.agent!.evaluation = result.data

    if (!result.ok) {
      // logger.debug({ id: job.job.id }, result.error.message)
      return "FAILED"
    }

    return "CHALLENGE"
  },

  CHALLENGE: async job => {
    const result = await challengeWithRetry(job)

    if (!result.ok) {
      // logger.error({ id: job.job.id, error: result.error }, "Challenge failed")
      return "FAILED"
    }

    job.agent!.risks = result.data
    return "DECIDE"
  },

  DECIDE: async job => {
    const decision = decideNextState(job)
    job.agent!.questions = decision.questions
    return decision.nextState
  },

  WAIT_FOR_HUMAN: async () => {
    // stop execution here
    return "WAIT_FOR_HUMAN"
  },

  PLAN: async job => {
    if (!job.agent) {
      throw new Error("Agent context is required to generate a plan")
    }
    job.agent.plan = await generatePlan(job.agent)
    return "DONE"
  },

  DONE: async () => {
    return Promise.reject()
  },

  FAILED: async () => {
    return "FAILED"
  }
}
