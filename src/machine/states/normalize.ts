import { ollama } from "#/lib/ai"
import { logger } from "#/lib/logger"
import { type JobSpec, JobSpecSchema } from "#/schemas/job"

const SYSTEM_PROMPT = `
You extract structured job requirements.
You do not evaluate candidates.
You do not give advice.
You only extract facts stated or strongly implied.
`

function buildNormalizePrompt(jobText: string) {
  return `
TASK:
Extract the job information into a structured format.

INPUT:
${jobText}

OUTPUT RULES:
- Only include information present in the text
- Do not infer candidate fit
- Use concise phrases
- Leave fields empty if information is missing
`
}

interface NormalizeError {
  reason: "SCHEMA_INVALID" | "MODEL_ERROR"
  message: string
  rawOutput?: unknown
}

type NormalizeResult = { ok: true; data: JobSpec } | { ok: false; error: NormalizeError }

export async function normalize(prompt: string): Promise<NormalizeResult> {
  const result = await ollama.chat({
    model: process.env.AGENT_MODEL,
    format: JobSpecSchema.toJSONSchema(),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildNormalizePrompt(prompt) }
    ]
  })

  let response
  try {
    response = JSON.parse(result.message.content)
  } catch (error) {
    logger.error({ error }, "Normalize response parse error")
    process.exit(1)
  }

  const { success, error, data } = JobSpecSchema.safeParse(response)

  if (!success) {
    logger.error({ error, response }, "Normalize response schema error")
    process.exit(1)
  }

  return { ok: true, data }
}
