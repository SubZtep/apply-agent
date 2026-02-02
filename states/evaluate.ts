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

const SYSTEM_PROMPT = "Do evaulation"

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
  // FIXME: build proper prompt
  return `Data: ${JSON.stringify(ctx)}`
}

export async function evaluateWithRetry(ctx: AgentContext, maxAttempts = 3): Promise<EvaluateResult> {
  let rawOutput: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateText({
        model: lmstudio(process.env.EVALUATE_MODEL!),
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
            rawOutput,
            message: "Evaluation lacks decision signal",
          },
        }
      }

      return { ok: true, data: result.output }
    } catch (err) {
      logger.warn({ attempt, err }, "Evaluate attempt failed")

      if (attempt === maxAttempts) {
        return {
          ok: false,
          error: {
            reason: err instanceof ZodError ? "SCHEMA_INVALID" : "MODEL_ERROR",
            rawOutput,
            message: "Failed to evaluate job fit",
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
