import { scoreSingleJob } from "#/batch/score"
import { logger } from "#/lib/logger"
import { FileAgentStore } from "#/lib/new_store"
import { isShortlisted } from "#/lib/spoilinger"
import { getProfileText } from "#/lib/user"

const cv = await getProfileText()
const store = new FileAgentStore()
const job = await store.load("inbox")

if (job && cv) {
  try {
    console.log("Start")
    job.batch = await scoreSingleJob(job, cv)
    logger.info({ id: job.job.id }, "Job scored")
  } catch (error: any) {
    logger.error({ job, error }, "Score job")
    process.exit(1)
  }

  const nextDir = isShortlisted(job.batch) ? "shortlisted" : "screened_out"
  store.save(nextDir, job)
}
