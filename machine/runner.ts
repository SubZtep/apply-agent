import { logger } from "#/lib/logger"
import { handlers } from "./handlers"
import type { AgentContext, AgentStore } from "./types"

export async function runAgent(agentId: string, initialContext: AgentContext, store: AgentStore) {
  const ctx = initialContext

  while (true) {
    const current = ctx.state
    logger.info({ state: current }, "Executing")

    const next = await handlers[current](ctx)
    ctx.state = next

    logger.info({ from: current, to: next }, "Transitioned")

    if (next === "DONE") {
      logger.info("Agent completed successfully")
      return
    }

    if (next === "FAILED") {
      logger.error({ errors: ctx.errors }, "Agent failed")
      return
    }

    if (next === "WAIT_FOR_HUMAN") {
      store.save({ id: agentId, state: "WAIT_FOR_HUMAN", context: ctx })
      logger.info({ questions: ctx.questions }, "Agent is waiting for human input")
      return
    }
  }
}
