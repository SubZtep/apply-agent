import { logger } from "../lib/logger"
// import type { FileAgentStore } from "../lib/persistence";
import { handlers } from "./handlers"
import type { AgentContext, AgentStore } from "./types"
// import { interpretHumanAnswers } from "./next"

// export async function runAgent({
//   initialContext,
//   agentId,
//   store,
// }: {
//   initialContext: AgentContext;
//   agentId: string;
//   store: AgentStore;
// }) {
// export async function runAgent({
//   initialContext,
//   agentId,
//   store,
// }: {
//   initialContext: AgentContext
//   agentId: string
//   store: AgentStore
// }) {
export async function runAgent(initialContext: AgentContext, store: AgentStore) {
  // const persisted = await store.load(agentId);
  // const ctx = persisted?.context ?? initialContext;
  const ctx = initialContext
  // const state = ctx.state

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
      store.save({ state: next, context: ctx })
      logger.info({ questions: ctx.questions }, "Agent is waiting for human input")
      return
    }

    // // ctx.state = await handlers[ctx.state](ctx)

    // // if (state === "WAIT_FOR_HUMAN") {
    // //   if (ctx.humanInput?.answers) {
    // //     state = interpretHumanAnswers(ctx) ? "PLAN" : "FAILED"
    // //     await store.save({
    // //       id: agentId,
    // //       state,
    // //       context: ctx,
    // //     })
    // //   } else {
    // //     console.log("Waiting for an answer. Agent ID:", agentId)
    // //     return
    // //   }
    // // }

    // // if (state === "DONE" || state === "FAILED") {
    // //   await store.save({
    // //     id: agentId,
    // //     state,
    // //     context: ctx,
    // //     // updatedAt: new Date().toISOString(),
    // //   })
    // //   return
    // // }

    // await store.save({
    //   id: agentId,
    //   // state,
    //   context: ctx,
    //   // updatedAt: new Date().toISOString(),
    // })

    // // const handler = handlers[state]
    // // if (!handler) {
    // //   throw new Error(`No handler for state ${state}`)
    // // }

    // // const nextState = await handler(ctx)
    // // // console.log("DECIDED", { from: ctx.state, next: nextState })
    // // ctx.state = nextState

    // // // terminal states
    // if (ctx.state === "DONE" || ctx.state === "FAILED") {
    //   console.log("FINITTTO")
    //   break
    // }

    // // // terminal states
    // // if (nextState === "DONE" || nextState === "FAILED") {
    // //   break
    // // }

    // // // explicit pause
    // // if (nextState === "WAIT_FOR_HUMAN") {
    // //   await store.save({
    // //     id: agentId,
    // //     state,
    // //     context: ctx,
    // //     updatedAt: Date.now(),
    // //   })
    // //   console.log("Waiting for an answer. Agent ID:", agentId)
    // //   exit()
    // //   // break
    // // }

    // if (ctx.state === "WAIT_FOR_HUMAN") {
    //   // await store.save({
    //   //   id: agentId,
    //   //   state,
    //   //   context: ctx,
    //   // })
    //   console.log("Waiting for an answer. Agent ID:", agentId)
    //   // return
    //   // exit()
    //   // break;
    //   process.exit(0)
    // }
  }

  // return ctx
}
