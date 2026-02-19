import { getInitialJobState } from "#/lib/job"
import { FileAgentStore } from "#/lib/store"
import { runSateMachine } from "#/machine/runner"
import { logger } from "./lib/logger"

const store = new FileAgentStore()
const job = await store.load("shortlisted")

if (job) {
  logger.trace({ id: job.job.id }, "Evaluate job")

  if (!job.agent) {
    job.agent = getInitialJobState()
  }

  // @ts-expect-error
  await runSateMachine(job, store)
}
