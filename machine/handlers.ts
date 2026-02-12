import { logger } from "#/lib/logger";
import { decideNextState } from "#/machine/next";
import type { Job } from "#/schemas/job";
import { challengeWithRetry } from "#/states/challenge";
import { evaluateWithRetry } from "#/states/evaluate";
import { normalizeWithRetry } from "#/states/normalize";
import { generatePlan } from "#/states/plan";
import type { AgentContext, AgentState } from "./types";

type StateHandler = (ctx: Job) => Promise<AgentState>;

export const handlers: Record<AgentState, StateHandler> = {
  IDLE: async () => "INGEST",

  INGEST: async (job: Job) => {
    if (!job.job.description || !job.job.description) {
      logger.error(job, "Missing input");
      return "FAILED";
    }
    return "NORMALIZE";
  },

  NORMALIZE: async (job: Job) => {
    const result = await normalizeWithRetry(job.job.description);

    if (!result.ok) {
      logger.error({ job }, result.error.message);
      // job.j.ctx.errors = [result.error.message];
      return "FAILED";
    }

    job.job = {
      ...job.job,
      ...result.data,
    };
    return "EVALUATE";
  },

  EVALUATE: async (job: Job) => {
    const result = await evaluateWithRetry(job);

    if (!result.ok) {
      // ctx.errors = [result.error.message];
      logger.error(job, result.error.message);
      return "FAILED";
    }

    // ctx.evaluation = result.data;
    job.agent!.evaluation = result.data;
    return "CHALLENGE";
  },

  CHALLENGE: async (job: Job) => {
    const result = await challengeWithRetry(ctx);

    if (!result.ok) {
      ctx.errors = [result.error.message];
      return "FAILED";
    }

    ctx.risks = result.data;
    return "DECIDE";
  },

  DECIDE: async (ctx) => {
    const decision = decideNextState(ctx);
    ctx.questions = decision.questions;
    return decision.nextState;
  },

  WAIT_FOR_HUMAN: async () => {
    // stop execution here
    return "WAIT_FOR_HUMAN";
  },

  PLAN: async (ctx) => {
    ctx.plan = await generatePlan(ctx);
    return "DONE";
  },

  DONE: async () => {
    return Promise.reject();
  },

  FAILED: async () => {
    return "FAILED";
  },
};
