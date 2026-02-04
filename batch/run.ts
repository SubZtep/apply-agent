import { join } from "node:path"
import Papa from "papaparse"
import { logger } from "#/lib/logger"
import type { Job } from "#/schemas/job"
import { scoreJobs } from "./score"
import type { ScrapedJob } from "./types"

const JOBS_DIR = join(import.meta.dirname, "..", "data", "jobs")

const csv = Bun.file(join(JOBS_DIR, "inbox", "jobs.csv"))
if (!(await csv.exists())) {
  throw new Error("Please scrape some jobs first.")
}

const jobs: Record<string, Job> = {}
const profileText = await Bun.file(join(import.meta.dirname, "..", "data", "cv.md")).text()

Papa.parse<ScrapedJob>(await csv.text(), {
  header: true,
  skipEmptyLines: true,
  complete: ({ data }) => {
    logger.info({ count: data.length }, "Scraped jobs found")
    data.forEach(job => {
      const id = generateJobId(job.title, job.company, job.job_url)
      //TODO: if id exists anywhere in the data, skip it
      jobs[id] = {
        job: {
          id,
          source: job.site,
          title: job.title,
          company: job.company,
          description: job.description,
          url: job.job_url,
          location: job.location,
        },
      }
    })
  },
})

const res = await scoreJobs(Object.values(jobs), profileText)
for (const { id, ...batch } of res) {
  const job = jobs[id]
  if (!job) throw new Error(`Disappeared job: ${id}`)
  const barchDir = isShortlisted(batch) ? "shortlisted" : "screened_out"
  job.batch = batch
  await Bun.write(join(JOBS_DIR, barchDir, `${id}.json`), JSON.stringify(job, null, 2))
}

function isShortlisted(batch: { score: number }) {
  // FIXME: proper check
  return batch.score > 0.4
}

function generateJobId(title: string, company: string, url: string): string {
  const normalized = `${title.trim()}|${company.trim()}|${url.trim()}`.toLowerCase()
  return Bun.hash(normalized).toString(16)
}
