import { logger } from "#/lib/logger"
import { handlers } from "./handlers"
import type { AgentState, AgentStore, PersistedAgent } from "./types"

export async function runAgent(persisted: PersistedAgent, store: AgentStore) {
  while (true) {
    const next = await handlers[persisted.state](persisted.context)
    persisted.state = next
    await store.save(persisted)

    if (terminal(next)) return
  }
}

function terminal(state: AgentState) {
  switch (state) {
    case "DONE":
      logger.info("Agent completed successfully")
      break
    case "FAILED":
      logger.error("Agent failed")
      break
    case "WAIT_FOR_HUMAN":
      logger.info("Agent is waiting for human input")
      break
  }
  return ["DONE", "FAILED", "WAIT_FOR_HUMAN"].includes(state)
}
