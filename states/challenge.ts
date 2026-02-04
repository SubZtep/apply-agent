import { generateText, Output } from "ai"
import { ZodError } from "zod"
import { lmstudio } from "#/lib/ai"
import { logger } from "#/lib/logger"
import type { AgentContext } from "#/machine/types"
import { type RiskAssessment, RiskAssessmentSchema } from "#/schemas/risk"

interface ChallengeError {
  reason: "SCHEMA_INVALID" | "MODEL_ERROR" | "LOW_QUALITY"
  rawOutput?: unknown
  message: string
}

type ChallengeResult = { ok: true; data: RiskAssessment } | { ok: false; error: ChallengeError }

const SYSTEM_PROMPT = `
You identify risks and gaps in a job application strategy.
You do not decide whether to proceed.
You do not rewrite experience.
`

function buildChallengePrompt(ctx: AgentContext) {
  return `
TASK:
Identify risks or gaps that could weaken this application.

JOB:
${JSON.stringify(ctx.job, null, 2)}

EVALUATION:
${JSON.stringify(ctx.evaluation, null, 2)}

OUTPUT RULES:
- Hard gaps are missing required experience
- Soft gaps are weaker or indirect matches
- Mitigations are possible framing strategies
- Be specific and concise
`
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
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateText({
        model: lmstudio(process.env.AGENT_MODEL),
        output: Output.object({ schema: RiskAssessmentSchema }),
        system: SYSTEM_PROMPT,
        prompt: buildChallengePrompt(ctx),
      })

      const risks = RiskAssessmentSchema.parse(result.output)

      if (!hasUsableRisks(risks)) {
        // TODO: Retry once with a stricter prompt or downgrade to FAILED immediately
        return {
          ok: false,
          error: {
            reason: "LOW_QUALITY",
            message: "Risk assessment lacks actionable signal",
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
          },
        }
      }
    }
  }

  throw new Error("Unreachable")
}
