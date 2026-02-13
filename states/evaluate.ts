import { generateText, Output } from "ai"
import { ZodError } from "zod"
import { lmstudio } from "#/lib/ai"
import { logger } from "#/lib/logger"
import { type Evaluation, EvaluationSchema } from "#/schemas/evalution"
import type { Job } from "#/schemas/job"

const SYSTEM_PROMPT = `
You assess how well a candidate matches job requirements.
You do not decide outcomes.
You provide evidence-based confidence only.
`

type EvaluateResult = { ok: true; data: Evaluation } | { ok: false; error: EvaluateError }

interface EvaluateError {
  reason: "SCHEMA_INVALID" | "MODEL_ERROR" | "INSUFFICIENT_SIGNAL"
  rawOutput?: unknown
  message: string
}

function hasSufficientSignal(evaluation: Evaluation): boolean {
  return evaluation.requirements.some(r => r.confidence < 0.5)
}

function buildEvaluationPrompt(job: Job) {
  return `
TASK:
Evaluate how well the candidate meets each job requirement.

JOB REQUIREMENTS:
${JSON.stringify(job.job, null, 2)}

CANDIDATE PROFILE:
${job.job.profileText}

OUTPUT RULES:
- Confidence must be between 0 and 1
- Use evidence from the profile
- Do not invent experience
- If unclear, lower confidence
`
}

export async function evaluateWithRetry(_job: Job, maxAttempts = 3): Promise<EvaluateResult> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateText({
        model: lmstudio(process.env.AGENT_MODEL),
        output: Output.object({ schema: EvaluationSchema }),
        system: SYSTEM_PROMPT,
        prompt: buildEvaluationPrompt(ctx),
      })

      if (!hasSufficientSignal(result.output)) {
        return {
          ok: false,
          error: {
            reason: "INSUFFICIENT_SIGNAL",
            message: "Evaluation lacks decision signal",
          },
        }
      }

      return { ok: true, data: result.output }
    } catch (err) {
      logger.warn({ attempt, err }, "EVALUATE attempt failed")

      if (attempt === maxAttempts) {
        return {
          ok: false,
          error: {
            reason: err instanceof ZodError ? "SCHEMA_INVALID" : "MODEL_ERROR",
            message: "Failed to evaluate job fit",
          },
        }
      }
    }
  }

  throw new Error("Unreachable")
}
