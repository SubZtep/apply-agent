import type { AgentContext } from ".."
import { handlers } from "./handlers"

export async function runAgent(initialContext: AgentContext) {
  const ctx = initialContext

  while (true) {
    const state = ctx.state
    console.log(`→ State: ${state}`, ctx)

    const handler = handlers[state]
    if (!handler) {
      throw new Error(`No handler for state ${state}`)
    }

    const nextState = await handler(ctx)
    ctx.state = nextState

    // terminal states
    if (nextState === "DONE" || nextState === "FAILED") {
      break
    }

    // explicit pause
    if (nextState === "WAIT_FOR_HUMAN") {
      break
    }
  }

  return ctx
}
