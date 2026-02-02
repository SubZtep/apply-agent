import { generateText, Output } from "ai"
import { ZodError, z } from "zod"
import type { AgentContext } from ".."
import { lmstudio } from "../lib/ai"
import { logger } from "../lib/logger"

const Evaluation = z.object({
  requirements: z
    .array(
      z.object({
        requirement: z.string().min(1),
        confidence: z.number().min(0).max(1),
        evidence: z.string().min(1),
      }),
    )
    .min(1),
})

export type Evaluation = z.infer<typeof Evaluation>

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

function buildEvaluationPrompt(ctx: AgentContext) {
  return `
TASK:
Evaluate how well the candidate meets each job requirement.

JOB REQUIREMENTS:
${JSON.stringify(ctx.job, null, 2)}

CANDIDATE PROFILE:
${ctx.profileText}

OUTPUT RULES:
- Confidence must be between 0 and 1
- Use evidence from the profile
- Do not invent experience
- If unclear, lower confidence
`
}

export async function evaluateWithRetry(ctx: AgentContext, maxAttempts = 3): Promise<EvaluateResult> {
  let rawOutput: unknown = undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateText({
        model: lmstudio(process.env.EVALUATE_MODEL),
        output: Output.object({ schema: Evaluation }),
        system: SYSTEM_PROMPT,
        prompt: buildEvaluationPrompt(ctx),
      })
      rawOutput = result.output

      if (!hasSufficientSignal(result.output)) {
        return {
          ok: false,
          error: {
            reason: "INSUFFICIENT_SIGNAL",
            message: "Evaluation lacks decision signal",
            rawOutput,
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
            rawOutput,
          },
        }
      }
    }
  }

  return {
    ok: false,
    error: {
      reason: "MODEL_ERROR",
      message: "Unexpected evaluation failure",
    },
  }
}
