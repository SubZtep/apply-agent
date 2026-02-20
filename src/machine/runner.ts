import { logger } from "#/lib/logger"
import type { AgentStore } from "#/lib/store"
import type { Job } from "#/schemas/job"
import { handlers } from "./handlers"
import { terminal } from "./next"

export async function runSateMachine(job: Job & { agent: NonNullable<Job["agent"]> }, store: AgentStore) {
  while (true) {
    logger.trace({ id: job.job.id, state: job.agent.state }, "State running")

    const nextState = await handlers[job.agent.state](job)
    job.agent.state = nextState
    store.save(job)

    if (terminal(nextState)) {
      logger.trace({ id: job.job.id, state: nextState }, "Terminal state machine")
      return
    }
  }
}
