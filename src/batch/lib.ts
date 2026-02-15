import type { Job } from "#/schemas/job"
import type { ScrapedJob } from "./types"

export function calculateJobId({ title, company, job_url: url }: ScrapedJob) {
  const normalized = `${title.trim()}|${company.trim()}|${url.trim()}`.toLowerCase()
  return Bun.hash(normalized).toString(16)
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

/** Clamp + round model score */
export function normalizeScore(score: number) {
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100))
}

/** Enforce penalties deterministically */
export function applyRedFlagPenalty(score: number, redFlags: string[]) {
  const penalty = redFlags.length * 0.1
  return Math.max(0, Math.round((score - penalty) * 100) / 100)
}
