import { join } from "node:path"
import { getInitialJobState, isShortlisted, jobDir, mapScrapedJobToJob } from "#/lib/job"
import { logger } from "#/lib/logger"
import { runSateMachine } from "#/machine/runner"
import type { Job } from "#/schemas/job"
import { ScrapedJobSchema } from "#/schemas/scraped_job"
import { batchScoringJobs } from "#/score/batch"
import { scoreSingleJob } from "#/score/score"
import type { AgentStore } from "./store"
import { getProfileText } from "./user"

export async function ingest() {
  const inboxDir = jobDir("inbox")
  const jsonFile = Bun.file(join(inboxDir, "jobs.json"))

  if (!(await jsonFile.exists())) {
    logger.warn("No scraped jobs found.")
    process.exit()
  }

  const scrapedJobsRaw = await jsonFile.json()

  const scrapedJobs = ScrapedJobSchema.array().parse(scrapedJobsRaw)
  const jobs = scrapedJobs.map(mapScrapedJobToJob)

  for (const job of jobs) {
    await Bun.write(join(inboxDir, `${job.job.id}.json`), JSON.stringify(job, null, 2))
  }

  await jsonFile.delete()
}

export async function scoring(store: AgentStore, id?: string) {
  const cv = await getProfileText()
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
    await store.save(job, nextDir)
    logger.info({ id: job.job.id, dir: nextDir }, "Job scored")
  } else {
    // Batch scoring
    await batchScoringJobs(store, cv)
  }
}

export async function evaluation(store: AgentStore, id?: string) {
  let job: Job | null
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
}

export async function answer(store: AgentStore, id?: string) {
  let job: Job | null
  do {
    job = await store.load("awaiting_input", id)

    if (job) {
      logger.trace({ id: job.job.id }, "Answer question")

      console.log(`\nAnswer the questions for ${job.job.title}:`)
      console.log("(Press Enter to skip a question)\n")

      const answers: Record<string, string> = {}
      for (const q of job.agent!.questions || []) {
        const answer = prompt(`${q.text}\n> `)
        answers[q.id] = answer ?? ""
      }

      // Human input is only consumed by DECIDE state
      job.agent!.state = "DECIDE"
      job.agent!.humanInput = { answers }

      await store.save(job, "shortlisted")
    }
  } while (job)
}
