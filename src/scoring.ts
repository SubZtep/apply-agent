import { isShortlisted } from "#/lib/job"
import { logger } from "#/lib/logger"
import { FileAgentStore } from "#/lib/store"
import { getProfileText } from "#/lib/user"
import { scoreSingleJob } from "#/score/score"
import { batchScoringJobs } from "./score/batch"

const cv = await getProfileText()
const store = new FileAgentStore()

const id = Bun.argv[2]
if (id) {
  // Score a single job
  const job = await store.load("inbox", id === "x" ? undefined : id)
  if (!job) process.exit(0)
  try {
    job.batch = await scoreSingleJob(job, cv)
  } catch (error: any) {
    logger.error({ job, error }, "Score job")
    process.exit(1)
  }
  const nextDir = job.batch && isShortlisted(job.batch) ? "shortlisted" : "screened_out"
  store.save(nextDir, job)
  logger.info({ id: job.job.id, dir: nextDir }, "Job scored")
} else {
  // Batch scoring
  await batchScoringJobs(store, cv)
}
