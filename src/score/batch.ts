import pLimit from "p-limit"
import { isShortlisted } from "#/lib/job"
import { logger } from "#/lib/logger"
import type { AgentStore } from "#/lib/store"
import type { Job } from "#/schemas/job"
import { scoreSingleJob } from "#/score/score"

export async function batchScoringJobs(store: AgentStore, profileText: string, limit = 2) {
  const jobs: Job[] = []
  let job: Job | null
  do {
    job = await store.load("inbox")
    if (job) {
      jobs.push(job)
    }
  } while (job)

  if (jobs.length === 0) {
    logger.info("No jobs in inbox to score")
    return
  }

  const rateLimiter = pLimit(limit)

  const results = await Promise.allSettled(
    jobs.map(async job => {
      const batch = await rateLimiter(() => scoreSingleJob(job, profileText))
      const nextDir = batch && isShortlisted(batch) ? "shortlisted" : "screened_out"
      const updatedJob = { ...job, batch }
      store.save(updatedJob, nextDir)
      return { job: updatedJob, nextDir }
    })
  )

  let shortlisted = 0
  let screenedOut = 0
  let failed = 0

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.nextDir === "shortlisted") {
        shortlisted++
      } else {
        screenedOut++
      }
    } else {
      failed++
      logger.error({ error: result.reason }, "Failed to score job")
    }
  }

  logger.info({ shortlisted, screenedOut, failed }, "Batch scoring complete")
}
