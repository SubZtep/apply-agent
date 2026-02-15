import { join } from "node:path"
import { ScrapedJobSchema } from "#/schemas/batch"
import { mapScrapedJobToJob } from "./lib"

const inboxDir = join(process.env.JOBS_DIR, "inbox")
const jsonFile = Bun.file(join(inboxDir, "jobs.json"))

if (!(await jsonFile.exists())) {
  process.exit()
}

const scrapedJobsRaw = await jsonFile.json()
const scrapedJobs = ScrapedJobSchema.array().parse(scrapedJobsRaw)
const jobs = scrapedJobs.map(mapScrapedJobToJob)

for (const job of jobs) {
  await Bun.write(join(inboxDir, `${job.job.id}.json`), JSON.stringify(job, null, 2))
}

await jsonFile.unlink()
