import { join } from "node:path"
import { FileAgentStore } from "./lib/store"
import { runAgent } from "./machine/runner"
import type { AgentContext } from "./machine/types"

const store = new FileAgentStore()

async function cmdRun(agentId?: string) {
  const context: AgentContext = {
    mode: "strict",
    state: "IDLE",
    jobText: await Bun.file(join(import.meta.dirname, "data", "job.md")).text(),
    profileText: await Bun.file(join(import.meta.dirname, "data", "cv.md")).text(),
  }
  const id = agentId ?? Bun.randomUUIDv7()
  await runAgent(id, context, store)

  const persisted = await store.load(id)
  if (persisted?.state === "WAIT_FOR_HUMAN") {
    console.log("Agent paused. Questions to answer:")
    persisted.context.questions?.forEach(q => void console.log(`  - [${q.id}] ${q.text}`))
    console.log(`\nRun: bun start answer ${agentId}`)
  }
}

async function cmdAnswer(agentId: string, forceProceed = false) {
  const persisted = await store.load(agentId)
  if (!persisted) {
    console.log("Agent not found")
    process.exit(1)
  }
  if (persisted.state !== "WAIT_FOR_HUMAN") {
    console.log("Agent is not waiting for human input")
    process.exit(1)
  }

  const answers: Record<string, string> = {}

  console.log("\nAnswer the questions:")
  for (const q of persisted.context.questions || []) {
    const answer = prompt(`${q.text}\n> `)
    answers[q.id] = answer ?? ""
  }

  persisted.state = "DECIDE"
  persisted.context.humanInput = {
    answers,
    forceProceed,
  }
  // delete persisted.context.questions
  await store.save(persisted)

  console.log("\nResuming agent...")
  await runAgent(agentId, persisted.context, store)
}

const [, , command, agentId, forceProceed] = Bun.argv

if (command === "run") {
  await cmdRun(agentId)
} else if (command === "answer" && agentId) {
  await cmdAnswer(agentId, forceProceed === "--force-proceed")
} else {
  console.log("Usage: bun start run [<agentId>]\n       bun start answer <agentId> [--force-proceed]\n")
  process.exit(0)
}

process.exit()
