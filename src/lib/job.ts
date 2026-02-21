import { join } from "node:path"
import type { Job, JobAgentContext, JobDir } from "#/schemas/job"
import type { ScrapedJob } from "#/schemas/scraped_job"
import type { AgentStore } from "./store"

export function calculateJobId({ title, company, job_url }: ScrapedJob) {
  const normalized = `${title.trim()}|${company.trim()}|${job_url.trim()}`.toLowerCase()
  return Bun.hash(normalized).toString(16)
}

export function getInitialJobState() {
  return {
    mode: process.env.MODE,
    state: "IDLE"
  } as JobAgentContext
}

/** Job dir in the file system. */
export function jobDir(dir?: JobDir) {
  if (!dir) {
    return process.env.JOBS_DIR
  }
  return join(process.env.JOBS_DIR, dir)
}

export function mapScrapedJobToJob(scrapedJob: ScrapedJob): Job {
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

export async function getAllJobs(store: AgentStore, dir: JobDir = "inbox") {
  const jobs: Job[] = []
  let job: Job | null
  do {
    job = await store.load(dir)
    if (job) {
      jobs.push(job)
    }
    // TODO: pagination or something memory efficient
  } while (job)
  return jobs
}
