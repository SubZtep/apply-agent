import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { $ } from "bun"
import { jobDir } from "./lib/job"
import { logger } from "./lib/logger"
import { evaluation, ingest, scoring } from "./lib/runner"
import { FileAgentStore } from "./lib/store"

const store = new FileAgentStore()

/** Check file-system state. */
const hasJob = {
  scraped: async () => await Bun.file(join(jobDir("inbox"), "jobs.json")).exists(),
  ingested: async () =>
    (await readdir(jobDir("inbox"))).filter(f => f.endsWith(".json")).filter(f => !f.startsWith("jobs.")).length > 0,
  shortlisted: async () => (await readdir(jobDir("shortlisted"))).filter(f => f.endsWith(".json")).length > 0,
  awaiting: async () => (await readdir(jobDir("awaiting_input"))).filter(f => f.endsWith(".json")).length > 0
}

while (true) {
  if (await hasJob.awaiting()) {
    console.log("🧑‍🎨 Please run:\n$ bun cli answer\n")
  }

  if (!(await hasJob.scraped())) {
    logger.trace({ orchestrator: true }, "Run scraper")
    await $`tools/scraper/run.sh`
  }

  if (await hasJob.scraped()) {
    logger.trace({ orchestrator: true }, "Ingest scraped jobs")
    await ingest()
  }

  if (await hasJob.ingested()) {
    logger.trace({ orchestrator: true }, "Batch scoring")
    await scoring(store)
  }

  if (await hasJob.shortlisted()) {
    logger.trace({ orchestrator: true }, "Evaluation")
    await evaluation(store)
  }

  await Bun.sleep(1000)
}
