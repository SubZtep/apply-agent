import { ollama } from "#/lib/ai"
import { logger } from "#/lib/logger"
import { getProfileText } from "#/lib/user"
import { type Evaluation, EvaluationSchema, type Job } from "#/schemas/job"

const SYSTEM_PROMPT = `
You are a deterministic job evaluator.

Return JSON only.

You assess how well a candidate matches job requirements.

Rules:
- You do not decide outcomes.
- You provide requirements with candidate’s confidence with evidence only.
- Confidence score MUST BE between 0 and 1.
- Do NOT invent abstract skills.
- Only use concrete words found in job or profile.
- If unsure, leave array empty.
- Be conservative.
`

type EvaluateResult = { ok: true; data: Evaluation } | { ok: false; data?: Evaluation; error: EvaluateError }

interface EvaluateError {
  reason: "SCHEMA_INVALID" | "MODEL_ERROR" | "INSUFFICIENT_SIGNAL"
  rawOutput?: unknown
  message: string
}

function hasSufficientSignal(evaluation: Evaluation) {
  // return evaluation.requirements.some(r => r.confidence < 0.5)
  return evaluation.requirements.some(r => r.confidence < 0.6)
}

function buildEvaluationPrompt(job: Job, profileText: string) {
  return `
## Task

Evaluate how well the candidate meets each job requirement.

## Job description

${job.job.description}

## Job responsibilities

- ${job.job.responsibilities?.join("\n- ")}

## Required skills

- ${job.job.skills?.join("\n- ")}

## Candidate profile

${profileText}

## OUTPUT RULES

- Collect job requirements
`
}

const profile = await getProfileText()

export async function evaluate(job: Job): Promise<EvaluateResult> {
  const result = await ollama.chat({
    model: process.env.AGENT_MODEL,
    format: EvaluationSchema.toJSONSchema(),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildEvaluationPrompt(job, profile) }
    ]
  })

  let response
  try {
    response = JSON.parse(result.message.content)
  } catch (error) {
    logger.error({ error, id: job.job.id }, "Evaluate response parse error")
    process.exit(1)
  }

  const { success, error, data: evaluation } = EvaluationSchema.safeParse(response)

  if (!success) {
    logger.error({ error, id: job.job.id, response }, "Challenge response schema error")
    process.exit(1)
  }

  if (hasSufficientSignal(evaluation)) {
    return { ok: true, data: evaluation }
  }

  return {
    ok: false,
    data: evaluation,
    error: {
      reason: "INSUFFICIENT_SIGNAL",
      message: "Evaluation lacks decision signal"
    }
  }
}
