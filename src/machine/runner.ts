import { logger } from "#/lib/logger"
import type { AgentStore } from "#/lib/store"
import type { Job } from "#/schemas/job"
import { handlers } from "./handlers"
import { terminal } from "./next"

export async function runSateMachine(job: Job & { agent: NonNullable<Job["agent"]> }, store: AgentStore) {
  while (true) {
    const start = performance.now()
    const nextState = await handlers[job.agent.state](job)
    const duration = performance.now() - start

    logger.trace({ id: job.job.id, from: job.agent.state, to: nextState, duration }, "State handler")

    job.agent.state = nextState
    store.save(job)

    if (terminal(nextState)) {
      // logger.trace({ id: job.job.id, state: nextState }, "Terminal state machine")
      return
    }
  }
}
