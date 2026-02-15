import type { BatchScore } from "#/schemas/batch"

/**
 * 🦥 Tells if **a job is not worth thinking** about 🐒
 */
export function isShortlisted(batch: BatchScore) {
  // TODO: add dark magic here
  return batch.score > 0.4
}
