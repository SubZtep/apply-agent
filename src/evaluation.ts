import { getInitialJobState } from "#/lib/job"
import { FileAgentStore } from "#/lib/store"
import { runSateMachine } from "#/machine/runner"
import { logger } from "./lib/logger"
import type { Job } from "./schemas/job"

const id = Bun.argv[2]
let job: Job | null
const store = new FileAgentStore()

do {
  job = await store.load("shortlisted", id)

  if (job) {
    logger.trace({ id: job.job.id }, "Evaluate job")

    if (!job.agent) {
      job.agent = getInitialJobState()
    }

    // @ts-expect-error job.agent exists
    await runSateMachine(job, store)
  }
} while (job)
