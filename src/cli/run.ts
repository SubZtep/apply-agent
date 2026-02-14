import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { logger } from "#/lib/logger"
import { FileAgentStore } from "#/lib/store"
import { runAgent } from "#/machine/runner"
import type { JobState } from "#/machine/types"

const store = new FileAgentStore()

const pickDir: JobState = "shortlisted"
const dir = join(process.env.JOBS_DIR, pickDir)

while (true) {
  const jobIds: string[] = (await readdir(dir)).filter(f => f.endsWith(".json")).map(f => f.slice(0, -5))

  if (jobIds.length === 0) {
    logger.info("No more batched job")
    break
  }

  const randomJobId = jobIds[Math.floor(Math.random() * jobIds.length)]!
  const job = await store.load(randomJobId, pickDir)
  if (!job) {
    logger.warn({ randomJobId, pickDir }, "Ghosted job")
    continue
  }

  if (!job.agent) {
    job.agent = {
      mode: process.env.MODE ?? (process.env.FORCE_PROCEED ? "exploratory" : "strict"),
      state: "IDLE",
    }
  }

  await runAgent(job, store)
}

process.exit()
