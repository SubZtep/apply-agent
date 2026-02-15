import { rename } from "node:fs/promises"
import { join } from "node:path"
import { spinner } from "@clack/prompts"
import { json } from "zod"
import { logger } from "#/lib/logger"
import { isShortlisted } from "#/lib/spoilinger"
import { FileAgentStore } from "#/lib/store"
import { getProfileText } from "#/lib/user"
import type { JobState } from "#/machine/types"
import { type BatchScore, ScrapedJobSchema } from "#/schemas/batch"
import type { Job } from "#/schemas/job"
import { FileAgentStore, getAJob } from "../lib/store"
import { mapScrapedJobToJob } from "./lib"
import { scoreJobs, scoreSingleJob } from "./score"

const { id, dir } = await getAJob("inbox")
// logger.info({ id, dir }, "Batch scoring")
if (id && dir) {
  const sp = spinner({ cancelMessage: "Gimme more GPU!!!" })

  const store = new FileAgentStore()
  const job = await store.load(id, dir)
  const cv = await getProfileText()

  if (job && cv) {
    // let batch: BatchScore
    sp.start(`Batch scoring ${dir}`)
    try {
      job.batch = await scoreSingleJob(job, cv)
      sp.stop(`${id} is another success`)
      // console.log("res", batch)
      // job.batch = batch
      // sp.stop(`yey, id ${id}`)
    } catch (error: any) {
      console.log("EEE", { error })
      sp.error(error.messages)
      logger.error({ error }, "score single job failed")
      throw error
    }

    const nextDir: JobState = isShortlisted(job.batch) ? "shortlisted" : "screened_out"
    store.save(job, nextDir, "inbox")
  }
}

// /** Tells if a job is not worth thinking about. 🦥 */
// function isShortlisted(batch: { score: number }) {
//   // TODO: add dark magic here
//   return batch.score > 0.4
// }

// // import type { ScrapedJob } from "./types"

// const inboxDir = join(process.env.JOBS_DIR, "inbox")
// const jsonFile = Bun.file(join(inboxDir, "jobs.json"))

// if (!(await jsonFile.exists())) {
//   throw new Error("Please scrape some jobs first.")// }

// // const scrapedJobsRaw: ScrapedJob[] = await jsonFile.json()
// const scrapedJobsRaw = await jsonFile.json()
// // ScrapedJobSchema.parse(scrapedJobsRaw[0])
// const scrapedJobs = ScrapedJobSchema.array().parse(scrapedJobsRaw)

// const rawJobs = scrapedJobs.map(mapScrapedJobToJob)

// const jobs = await scoreJobs(rawJobs, await getProfileText())
// console.log("XXX", jobs[0])
// const store = new FileAgentStore()

// for (const job of jobs) {
//   if (!job.batch) {
//     logger.error({ job }, "Missing batch")
//     throw new Error("Job batching failed")
//   }

//   const dir: JobState = isShortlisted(job.batch) ? "shortlisted" : "screened_out"
//   store.save(job, dir)
// }

// try {
//   await rename(join(inboxDir, "jobs.json"), join(inboxDir, `jobs_${Date.now()}.json`))
// } catch (error) {
//   logger.error({ error }, "Couldn't rename jobs.json")
// }

// function isShortlisted(batch: { score: number }) {
//   // TODO: proper check
//   return batch.score > 0.4
// }
