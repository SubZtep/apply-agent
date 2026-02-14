import { join } from "node:path"
import Papa from "papaparse"
import type { Job } from "#/schemas/job"
import { scoreJobs } from "./score"
import type { ScrapedJob } from "./types"

const profileText = await Bun.file(process.env.CV_FILE).text()
const csv = Bun.file(join(process.env.JOBS_DIR, "inbox", "jobs.csv"))

if (!(await csv.exists())) {
  throw new Error("Please scrape some jobs first.")
}

const { data: scrapedJobs } = Papa.parse<ScrapedJob>(await csv.text(), {
  header: true,
  skipEmptyLines: true,
})

const rawJobs = scrapedJobs
  // .slice(0, 2)
  .map(scoreJob => {
    const job: Job = {
      job: {
        id: calculateJobId(scoreJob),
        title: scoreJob.title,
        description: scoreJob.description,
        company: scoreJob.company,
        location: scoreJob.location,
        source: scoreJob.site,
        url: scoreJob.job_url,
      },
    }
    return job
  })

const jobs = await scoreJobs(rawJobs, profileText)

for (const job of jobs) {
  const {
    job: { id },
    batch,
  } = job
  if (!batch) throw new Error(`Job batching error: ${id}`)
  const batchDir = isShortlisted(batch) ? "shortlisted" : "screened_out"
  const jobFileName = join(process.env.JOBS_DIR, batchDir, `${id}.json`)
  await Bun.write(jobFileName, JSON.stringify(job, null, 2))
}

function isShortlisted(batch: { score: number }) {
  // TODO: proper check
  return batch.score > 0.4
}

function calculateJobId({ title, company, job_url: url }: ScrapedJob) {
  const normalized = `${title.trim()}|${company.trim()}|${url.trim()}`.toLowerCase()
  return Bun.hash(normalized).toString(16)
}
