import { logger } from "#/lib/logger"
import { decideNextState } from "#/machine/next"
import { challenge } from "#/machine/states/challenge"
import { evaluate } from "#/machine/states/evaluate"
import { normalize } from "#/machine/states/normalize"
import { generatePlan } from "#/machine/states/plan"
import type { AgentState, Job } from "#/schemas/job"

type StateHandler = (ctx: Job) => Promise<AgentState>

export const handlers: Record<AgentState, StateHandler> = {
  // FIXME: should add errors to the job.agent?
  IDLE: async () => "INGEST",

  INGEST: async job => {
    if (!job.job.description || !job.job.description) {
      // biome-ignore lint/suspicious/noAssignInExpressions: llm magic:)
      job.agent && (job.agent.errors = (job.agent.errors ?? []).concat("Missing input"))
      return "FAILED"
    }
    return "NORMALIZE"
  },

  NORMALIZE: async job => {
    const result = await normalize(job.job.description)

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
    const result = await evaluate(job)
    job.agent!.evaluation = result.data

    if (!result.ok) {
      logger.error({ id: job.job.id, error: result.error }, "Evaluate failed")
      return "FAILED"
    }

    return "CHALLENGE"
  },

  CHALLENGE: async job => {
    const result = await challenge(job)

    if (!result.ok) {
      logger.error({ id: job.job.id, error: result.error }, "Challenge failed")
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
