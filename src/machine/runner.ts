import { logger } from "#/lib/logger"
import type { AgentStore } from "#/lib/store"
import type { AgentState, Job } from "#/schemas/job"
import { handlers } from "./handlers"
import type { JobState } from "./types"

export async function runSateMachine(job: Job & { agent: NonNullable<Job["agent"]> }, store: AgentStore) {
  while (true) {
    logger.trace({ id: job.job.id, state: job.agent.state }, "Run state")

    const nextState = await handlers[job.agent.state](job)
    job.agent.state = nextState

    const stateDir: JobState =
      nextState === "WAIT_FOR_HUMAN" ? "awaiting_input" : nextState === "DONE" ? "approved" : "declined"

    store.save(stateDir, job)

    if (terminal(nextState)) {
      logger.info({ id: job.job.id, dir: stateDir }, "Job saved")
      return
    }
  }
}

function terminal(state: AgentState) {
  switch (state) {
    case "DONE":
      console.log("✅ Agent completed successfully")
      break
    case "FAILED":
      console.log("❌ Agent failed")
      break
    case "WAIT_FOR_HUMAN":
      console.log("⏸ Agent is waiting for human input")
      break
  }
  return ["DONE", "FAILED", "WAIT_FOR_HUMAN"].includes(state)
}

function _stateToDir(state?: AgentState) {
  let dir: JobState
  switch (state) {
    case "WAIT_FOR_HUMAN":
      dir = "awaiting_input"
      break
    case "DECIDE":
    default:
      dir = "shortlisted"
  }
  return dir
}
