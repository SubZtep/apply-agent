import { logger } from "./lib/logger"
import { answer, evaluation, ingest, scoring } from "./lib/runner"
import { FileAgentStore } from "./lib/store"

const [, , command, id] = Bun.argv
logger.info({ command, id }, "CLI running")

const store = new FileAgentStore()

switch (command) {
  case "ingest":
    await ingest()
    break
  case "scoring":
    await scoring(store, id)
    break
  case "evalution":
    await evaluation(store, id)
    break
  case "answer":
    await answer(store, id)
    break
  default:
    console.log(`Run a single step.\n\nUSAGE
  bun cli <answer|evalution|ingest|scoring> [job-id]\n`)
}

process.exit()
