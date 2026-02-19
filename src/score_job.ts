import { scoreSingleJob } from "#/batch/score"
import { logger } from "#/lib/logger"
import { isShortlisted } from "#/lib/spoilinger"
import { FileAgentStore } from "#/lib/store"
import { getProfileText } from "#/lib/user"

const cv = await getProfileText()
const store = new FileAgentStore()
const job = await store.load("inbox")

if (job && cv) {
  logger.trace({ id: job.job.id }, "Score job")
  try {
    job.batch = await scoreSingleJob(job, cv)
  } catch (error: any) {
    logger.error({ job, error }, "Score job")
    process.exit(1)
  }

  const nextDir = job.batch && isShortlisted(job.batch) ? "shortlisted" : "screened_out"
  store.save(nextDir, job)
  logger.info({ id: job.job.id, dir: nextDir }, "Job scored")
}
