import { join } from "node:path"
import { jobDir, mapScrapedJobToJob } from "./lib/job"
import { logger } from "./lib/logger"
import { ScrapedJobSchema } from "./schemas/scraped_job"

const inboxDir = jobDir("inbox")
const jsonFile = Bun.file(join(inboxDir, "jobs.json"))

if (!(await jsonFile.exists())) {
  logger.warn("No scraped jobs found.")
  process.exit()
}

const scrapedJobsRaw = await jsonFile.json()

const scrapedJobs = ScrapedJobSchema.array().parse(scrapedJobsRaw)
const jobs = scrapedJobs.map(mapScrapedJobToJob)

for (const job of jobs) {
  await Bun.write(join(inboxDir, `${job.job.id}.json`), JSON.stringify(job, null, 2))
}

await jsonFile.delete()
