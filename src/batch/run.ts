import { rename } from "node:fs/promises"
import { join } from "node:path"
import Papa from "papaparse"
import { logger } from "#/lib/logger"
import { FileAgentStore } from "#/lib/store"
import type { JobState } from "#/machine/types"
import { mapScrapedJobToJob } from "./lib"
import { scoreJobs } from "./score"
import type { ScrapedJob } from "./types"

const inboxDir = join(process.env.JOBS_DIR, "inbox")
const csv = Bun.file(join(inboxDir, "jobs.csv"))

if (!(await csv.exists())) {
  throw new Error("Please scrape some jobs first.")
}

const { data: scrapedJobs } = Papa.parse<ScrapedJob>(await csv.text(), {
  header: true,
  skipEmptyLines: true,
})

const profileText = await Bun.file(process.env.CV_FILE).text()
const rawJobs = scrapedJobs.map(mapScrapedJobToJob)
const jobs = await scoreJobs(rawJobs, profileText)
const store = new FileAgentStore()

for (const job of jobs) {
  if (!job.batch) {
    logger.error({ job }, "Missing batch")
    throw new Error("Job batching failed")
  }

  const dir: JobState = isShortlisted(job.batch) ? "shortlisted" : "screened_out"
  store.save(job, dir)
}

try {
  await rename(join(inboxDir, "jobs.csv"), join(inboxDir, `jobs_${Date.now()}.csv`))
} catch (error) {
  logger.error({ error }, "Couldn't rename jobs.csv")
}

function isShortlisted(batch: { score: number }) {
  // TODO: proper check
  return batch.score > 0.4
}
