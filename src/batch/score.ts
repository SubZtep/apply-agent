import { generateText, Output } from "ai"
import pLimit from "p-limit"
import { lmstudio } from "#/lib/ai"
import { BatchScoreSchema } from "#/schemas/batch"
import type { Job } from "#/schemas/job"

const limit = pLimit(2) // FIXME: Adjust concurrency based on model provider limits

/** Scores the batch */
export async function scoreJobs(jobs: Job[], profileText: string) {
  return Promise.all(jobs.map(job => limit(() => scoreSingleJob(job, profileText))))
}

const SYSTEM_PROMPT = `
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
`

export async function scoreSingleJob(job: Job, profileText: string) {
  const { output } = await generateText({
    model: lmstudio(process.env.BATCH_MODEL),
    output: Output.object({ schema: BatchScoreSchema }),
    system: SYSTEM_PROMPT,
    prompt: `
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
`,
  })

  const normalizedScore = normalizeScore(output.score)
  const finalScore = applyRedFlagPenalty(normalizedScore, output.redFlags)

  job.batch = {
    score: finalScore,
    signals: output.signals,
    redFlags: output.redFlags,
  }

  return job
}

/** Clamp + round model score */
export function normalizeScore(score: number) {
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100))
}

/** Enforce penalties deterministically */
export function applyRedFlagPenalty(score: number, redFlags: string[]) {
  const penalty = redFlags.length * 0.1
  return Math.max(0, Math.round((score - penalty) * 100) / 100)
}
