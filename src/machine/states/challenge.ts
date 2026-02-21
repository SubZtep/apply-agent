import { ollama } from "#/lib/ai"
import { logger } from "#/lib/logger"
import { type Job, type RiskAssessment, RiskAssessmentSchema } from "#/schemas/job"

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

function buildChallengePrompt(job: Job) {
  return `
TASK:
Identify risks or gaps that could weaken this application.

JOB:
${JSON.stringify(job.job, null, 2)}

EVALUATION:
${JSON.stringify(job.agent!.evaluation, null, 2)}

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

export async function challenge(job: Job): Promise<ChallengeResult> {
  const result = await ollama.chat({
    model: process.env.AGENT_MODEL,
    format: RiskAssessmentSchema.toJSONSchema(),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildChallengePrompt(job) }
    ]
  })

  let response
  try {
    response = JSON.parse(result.message.content)
  } catch (error) {
    logger.error({ error, id: job.job.id }, "Challenge reponse parse error")
    process.exit(1)
  }

  const { success, error, data: risks } = RiskAssessmentSchema.safeParse(response)

  if (!success) {
    logger.error({ error, id: job.job.id, response }, "Challenge reponse schema error")
    process.exit(1)
  }

  if (hasUsableRisks(risks)) {
    return { ok: true, data: risks }
  }

  return {
    ok: false,
    error: {
      reason: "LOW_QUALITY",
      message: "Risk assessment lacks actionable signal"
    }
  }
}
