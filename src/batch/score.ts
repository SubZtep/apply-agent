// import { generateText, Output } from "ai"
// import pLimit from "p-limit"
import { ollama } from "#/lib/ai"
import { logger } from "#/lib/logger"
// import { logger } from "#/lib/logger"
// import { type BatchScore, BatchScoreSchema } from "#/schemas/batch"
import { type Job, type Score, ScoreSchema } from "#/schemas/job"

// import { applyRedFlagPenalty, normalizeScore } from "./lib"

// const limit = pLimit(2) // FIXME: Adjust concurrency based on model provider limits

// /** Scores the batch */
// export async function scoreJobs(jobs: Job[], profileText: string) {
//   return Promise.all(jobs.map(job => limit(() => scoreSingleJob(job, profileText))))
// }

const prompts = {
  system: () => `
You are a job scoring function.

You must return structured output only.
Do not explain your answer.
Do not add extra keys.

Scoring rules (STRICT):

Start from a base score of 0.5.

Identify:
- required skills
- seniority expectations
- domain signals
- red flags

Then apply ALL applicable adjustments cumulatively:

Skills:
+0.2 strong skill overlap
+0.1 partial skill overlap
-0.2 major missing required skill

Seniority:
+0.1 seniority match
-0.1 seniority mismatch

Domain:
+0.1 domain match
-0.1 domain mismatch

Penalties:
For EACH red flag, subtract 0.1.

Clamp final score to range 0.0–1.0.
Round to at most 2 decimal places.

The final score MUST reflect penalties.
DO NOT ignore red flags.
DO NOT output percentages.
DO NOT use excessive precision.

The average job should score around 0.4.

Signals must be concrete evidence, not rubric labels.
Examples: "typescript", "backend APIs", "fintech domain"
Invalid: "skill overlap", "good fit"
`,
  prompt: (job: Job, profileText: string) => `
  PROFILE (summary):
  ${profileText}

  JOB:
  Title: ${job.job.title}

  Description:
  ${job.job.description}

  Evaluate fit using ONLY:
  - skill overlap
  - seniority match
  - domain relevance
  `
}

export async function scoreSingleJob(job: Job, profileText: string): Promise<Score | undefined> {
  const start = performance.now()
  const result = await ollama.chat({
    model: process.env.BATCH_MODEL,
    format: ScoreSchema.toJSONSchema(),
    messages: [
      { role: "system", content: prompts.system() },
      { role: "user", content: prompts.prompt(job, profileText) }
    ]
  })
  const duration = performance.now() - start
  logger.debug({ duration }, "Score job")

  let score: Score
  try {
    score = JSON.parse(result.message.content)
  } catch (error) {
    logger.error({ error, result }, "JSON Parse batch scoring result")
    return
  }

  return ScoreSchema.parse(score)
  // return ScoreSchema.parse(JSON.parse(res.message.content))
  // return BatchScoreSchema.parse(batch)

  // console.log("GOING TO PARSE", typeof res.message.content)
  // console.log()
  // const parsed = BatchScoreSchema.safeParse(res.message.content)
  // console.log("PARSED", parsed)
  // return res as any

  //   const { output } = await generateText({
  //     model: lmstudio(process.env.BATCH_MODEL),
  //     output: Output.object({ schema: BatchScoreSchema }),
  //     system: SYSTEM_PROMPT,
  //     prompt: `
  // PROFILE (summary):
  // ${profileText}

  // JOB:
  // Title: ${job.job.title}

  // Description:
  // ${job.job.description}

  // Evaluate fit using ONLY:
  // - skill overlap
  // - seniority match
  // - domain relevance
  // `
  //   })

  //   const normalizedScore = normalizeScore(output.score)
  //   const finalScore = applyRedFlagPenalty(normalizedScore, output.redFlags)

  //   job.batch = {
  //     score: finalScore,
  //     signals: output.signals,
  //     redFlags: output.redFlags
  //   }

  // return job
}
