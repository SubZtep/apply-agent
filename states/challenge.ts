import { generateText, Output } from "ai"
import { ZodError, z } from "zod"
import type { AgentContext } from ".."
import { lmstudio } from "../lib/ai"
import { logger } from "../lib/logger"

export const RiskAssessment = z.object({
  hardGaps: z.array(z.string().min(1)).max(5),
  softGaps: z.array(z.string().min(1)).max(5),
  mitigations: z.array(z.string().min(1)).max(5),
})

export type RiskAssessment = z.infer<typeof RiskAssessment>

interface ChallengeError {
  reason: "SCHEMA_INVALID" | "MODEL_ERROR" | "LOW_QUALITY"
  rawOutput?: unknown
  message: string
}

type ChallengeResult = { ok: true; data: RiskAssessment } | { ok: false; error: ChallengeError }

const SYSTEM_PROMPT = "You are the challenge state"

function buildChallengePrompt(ctx: AgentContext) {
  // FIXME: build proper prompt
  return `Data: ${JSON.stringify(ctx)}`
}

/**
 * - Allows hard-gap-driven escalation
 * - Prevents "everything is fine" hallucinations
 * - Avoids overwhelming soft-gap noise
 */
function hasUsableRisks(risks: RiskAssessment): boolean {
  return risks.hardGaps.length > 0 || risks.softGaps.length > 1
}

export async function challengeWithRetry(ctx: AgentContext, maxAttempts = 3): Promise<ChallengeResult> {
  let rawOutput: unknown = undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateText({
        model: lmstudio(process.env.CHALLENGE_MODEL),
        output: Output.object({ schema: RiskAssessment }),
        system: SYSTEM_PROMPT,
        prompt: buildChallengePrompt(ctx),
      })

      rawOutput = result.output
      const risks = RiskAssessment.parse(result.output)

      if (!hasUsableRisks(risks)) {
        // TODO: Retry once with a stricter prompt or downgrade to FAILED immediately
        return {
          ok: false,
          error: {
            reason: "LOW_QUALITY",
            message: "Risk assessment lacks actionable signal",
            rawOutput,
          },
        }
      }

      return { ok: true, data: risks }
    } catch (err) {
      logger.warn({ attempt, err }, "CHALLENGE attempt failed")

      if (attempt === maxAttempts) {
        return {
          ok: false,
          error: {
            reason: err instanceof ZodError ? "SCHEMA_INVALID" : "MODEL_ERROR",
            message: "Failed to assess risks",
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
      message: "Unexpected challenge failure",
    },
  }
}
