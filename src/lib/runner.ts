import { join } from "node:path"
import { JSONL } from "bun"
import { getAllJobs, getInitialJobState, jobDir, mapScrapedJobToJob } from "#/lib/job"
import { logger } from "#/lib/logger"
import { runSateMachine } from "#/machine/runner"
import type { Job, JobDir } from "#/schemas/job"
import { ScrapedJobSchema } from "#/schemas/scraped_job"
import { batchScoreJobs } from "#/score/batch"
import type { AgentStore } from "./store"
import { getProfileText } from "./user"
import { isShortlisted } from "./vars"

export async function ingest() {
  const inboxDir = jobDir("inbox")
  const jsonFile = Bun.file(join(inboxDir, "jobs.json"))

  if (!(await jsonFile.exists())) {
    logger.warn("No scraped jobs found.")
    process.exit()
  }

  const scrapedJobsRaw = await jsonFile.text()
  const scrapedJobsJson = JSONL.parse(scrapedJobsRaw)
  const scrapedJobs = ScrapedJobSchema.array().parse(scrapedJobsJson)
  const jobs = scrapedJobs.map(mapScrapedJobToJob)

  for (const job of jobs) {
    await Bun.write(join(inboxDir, `${job.job.id}.json`), JSON.stringify(job, null, 2))
  }

  await jsonFile.delete()
}

export async function scoring(store: AgentStore) {
  const profileText = await getProfileText()
  const jobs = await getAllJobs(store, "inbox")

  const { ranked, distribution } = await batchScoreJobs(jobs, profileText, {
    concurrency: 8
    // weights: {
    //   strongMatch: 0.1,
    //   missingSkill: 0.2,
    //   domainMatch: 0.1
    // }
  })

  logger.debug({ distribution }, "Batch score distribution")

  for (const { job, ...batch } of ranked) {
    job.batch = batch
    const moveTo: JobDir = isShortlisted(batch.score) ? "shortlisted" : "screened_out"
    store.save(job, moveTo)
  }
}

export async function evaluation(store: AgentStore, id?: string) {
  let job: Job | null
  do {
    job = await store.load("shortlisted", id)
    if (job) {
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
