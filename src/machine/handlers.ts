import { logger } from "#/lib/logger"
import { decideNextState } from "#/machine/next"
import type { Job } from "#/schemas/job"
import { challengeWithRetry } from "#/states/challenge"
import { evaluateWithRetry } from "#/states/evaluate"
import { normalizeWithRetry } from "#/states/normalize"
import { generatePlan } from "#/states/plan"
import type { AgentState } from "./types"

type StateHandler = (ctx: Job) => Promise<AgentState>

export const handlers: Record<AgentState, StateHandler> = {
  // FIXME: should add errors to the job.agent?
  IDLE: async () => "INGEST",

  INGEST: async job => {
    if (!job.job.description || !job.job.description) {
      logger.error(job, "Missing input")
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
      ...result.data,
    }
    return "EVALUATE"
  },

  EVALUATE: async job => {
    const result = await evaluateWithRetry(job)

    if (!result.ok) {
      logger.error(job, result.error.message)
      return "FAILED"
    }

    job.agent!.evaluation = result.data
    return "CHALLENGE"
  },

  CHALLENGE: async job => {
    const result = await challengeWithRetry(job)

    if (!result.ok) {
      logger.error(result.error, "Challenge failed")
      return "FAILED"
    }

    job.agent!.risks = result.data
    return "DECIDE"
  },

  DECIDE: async job => {
    const decision = decideNextState(job.agent!)
    job.agent!.questions = decision.questions
    return decision.nextState
  },

  WAIT_FOR_HUMAN: async () => {
    // stop execution here
    return "WAIT_FOR_HUMAN"
  },

  PLAN: async job => {
    job.plan = await generatePlan(job.agent)
    return "DONE"
  },

  DONE: async () => {
    return Promise.reject()
  },

  FAILED: async () => {
    return "FAILED"
  },
}
