import type { JobAgentContext } from "#/schemas/job"
import type { ScrapedJob } from "#/schemas/scraped_job"

export function calculateJobId({ title, company, job_url }: ScrapedJob) {
  const normalized = `${title.trim()}|${company.trim()}|${job_url.trim()}`.toLowerCase()
  return Bun.hash(normalized).toString(16)
}

export function getInitialJobState() {
  return {
    mode: process.env.MODE ?? (process.env.FORCE_PROCEED ? "exploratory" : "strict"),
    state: "IDLE"
  } as JobAgentContext
}
