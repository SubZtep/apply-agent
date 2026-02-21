import pLimit from "p-limit"
import { logger } from "#/lib/logger"
import type { Job } from "#/schemas/job"
import { scoreSingleJob } from "#/score/score"

export interface ScoredJob {
  job: Job
  score: number
  signals: string[]
  redFlags: string[]
}

// Utility to bucket scores
function bucketScore(score: number) {
  if (score < 0.3) return "<0.3"
  if (score < 0.6) return "0.3-0.6"
  if (score < 0.8) return "0.6-0.8"
  return ">0.8"
}

export async function batchScoreJobs(
  jobs: Job[],
  profileText: string,
  options?: {
    concurrency?: number
    shortlistThreshold?: number
    rejectThreshold?: number
  }
) {
  const limit = pLimit(options?.concurrency ?? 5)

  const tasks = jobs.map(job =>
    limit(async () => {
      const { score, contributions } = await scoreSingleJob(job.job, profileText)

      logger.info({
        title: job.job.title,
        score,
        contributions
      })

      return { job, score, contributions }
    })
  )

  const settled = await Promise.allSettled(tasks)

  const scores = settled.filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled").map(r => r.value)

  const distribution = {
    "<0.3": 0,
    "0.3-0.6": 0,
    "0.6-0.8": 0,
    ">0.8": 0
  }

  for (const entry of scores) {
    const bucket = bucketScore(entry.score)
    distribution[bucket]++
  }

  const ranked = [...scores].sort((a, b) => b.score - a.score)

  return {
    ranked,
    shortlisted: scores.filter(s => s.score >= (options?.shortlistThreshold ?? 0.6)),
    rejected: scores.filter(s => s.score < (options?.rejectThreshold ?? 0.4)),
    distribution
  }
}
