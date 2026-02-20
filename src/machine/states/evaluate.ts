import { ZodError } from "zod"
import { ollama } from "#/lib/ai"
import { logger } from "#/lib/logger"
import { getProfileText } from "#/lib/user"
import { type Evaluation, EvaluationSchema, type Job } from "#/schemas/job"

const SYSTEM_PROMPT = `
You assess how well a candidate matches job requirements.
You do not decide outcomes.
You provide evidence-based confidence only.
`

type EvaluateResult = { ok: true; data: Evaluation } | { ok: false; data?: Evaluation; error: EvaluateError }

interface EvaluateError {
  reason: "SCHEMA_INVALID" | "MODEL_ERROR" | "INSUFFICIENT_SIGNAL"
  rawOutput?: unknown
  message: string
}

function hasSufficientSignal(evaluation: Evaluation) {
  return evaluation.requirements.some(r => r.confidence < 0.5)
}

function buildEvaluationPrompt(job: Job, profileText: string) {
  return `
TASK:
Evaluate how well the candidate meets each job requirement.

JOB REQUIREMENTS:
${JSON.stringify(job.job, null, 2)}

CANDIDATE PROFILE:
${profileText}

OUTPUT RULES:
- Confidence must be between 0 and 1
- Use evidence from the profile
- Do not invent experience
- If unclear, lower confidence
`
}

const profile = await getProfileText()

export async function evaluateWithRetry(job: Job, maxAttempts = 3): Promise<EvaluateResult> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const start = performance.now()
      const result = await ollama.chat({
        model: process.env.AGENT_MODEL,
        format: EvaluationSchema.toJSONSchema(),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildEvaluationPrompt(job, profile) }
        ]
      })
      const duration = performance.now() - start
      logger.debug({ duration }, "Evaluate job")

      const evaluation = EvaluationSchema.parse(JSON.parse(result.message.content))

      if (!hasSufficientSignal(evaluation)) {
        return {
          ok: false,
          data: evaluation,
          error: {
            reason: "INSUFFICIENT_SIGNAL",
            message: "Evaluation lacks decision signal"
          }
        }
      }

      return { ok: true, data: evaluation }
    } catch (err) {
      logger.warn({ attempt, err }, "EVALUATE attempt failed")

      if (attempt === maxAttempts) {
        return {
          ok: false,
          error: {
            reason: err instanceof ZodError ? "SCHEMA_INVALID" : "MODEL_ERROR",
            message: "Failed to evaluate job fit"
          }
        }
      }
    }
  }

  throw "Unreachable"
}
