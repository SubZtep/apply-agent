import { logger } from "#/lib/logger"
import type { Job } from "#/schemas/job"
import { handlers } from "./handlers"
import type { AgentState, AgentStore, JobState } from "./types"

export async function runAgent(job: Job, store: AgentStore) {
  // if (!job.agent) {
  //   logger.warn({ job }, "Try to evaluate job without agent touch")
  //   throw new Error("job.agent is missing")
  // }
  const oldStateDir = stateToDir(job.agent.state)

  while (true) {
    const next = await handlers[job.agent.state](job)
    job.agent.state = next
    const stateDir: JobState = next === "WAIT_FOR_HUMAN" ? "awaiting_input" : next === "DONE" ? "approved" : "declined"
    store.save(job, stateDir, oldStateDir)

    if (terminal(next)) {
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

function stateToDir(state?: AgentState) {
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
