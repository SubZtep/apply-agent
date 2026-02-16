import type { BatchScore } from "#/schemas/batch"
import type { JobAgent } from "#/schemas/job"

/**
 * 🦥 Tells if **a job is not worth thinking** about 🐒
 */
export function isShortlisted(batch: BatchScore) {
  // TODO: add dark magic here
  return batch.score > 0.4
}

export function getInitialJobState() {
  return {
    mode: process.env.MODE ?? (process.env.FORCE_PROCEED ? "exploratory" : "strict"),
    state: "IDLE"
  } as JobAgent
}
