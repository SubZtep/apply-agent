import type { JobAgentContext, Score } from "#/schemas/job"
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

/**
 * 🦥 Tells if **a job is not worth thinking** about 🐒
 */
export function isShortlisted(score: Score) {
  // TODO: add dark magic here
  return score.score > 0.4
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
