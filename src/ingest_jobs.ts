import { join } from "node:path"
import { calculateJobId } from "./lib/job"
import { logger } from "./lib/logger"
import { jobDir } from "./lib/var"
import type { Job } from "./schemas/job"
import { type ScrapedJob, ScrapedJobSchema } from "./schemas/scraped_job"

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

await jsonFile.unlink()

// -+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-+H+-

function mapScrapedJobToJob(scrapedJob: ScrapedJob): Job {
  const job: Job = {
    job: {
      id: calculateJobId(scrapedJob),
      title: scrapedJob.title,
      description: scrapedJob.description,
      company: scrapedJob.company,
      location: scrapedJob.location,
      source: scrapedJob.site,
      url: scrapedJob.job_url
    }
  }
  return job
}
