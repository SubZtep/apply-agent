// import { generateText, Output } from "ai"
import { ZodError } from "zod"
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

export async function normalizeWithRetry(prompt: string, maxAttempts = 3): Promise<NormalizeResult> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // const result = await generateText({
      //   model: lmstudio()(process.env.AGENT_MODEL),
      //   output: Output.object({ schema: JobSpecSchema }),
      //   system: SYSTEM_PROMPT,
      //   prompt: buildNormalizePrompt(prompt)
      // })
      const start = performance.now()
      const result = await ollama.chat({
        model: process.env.AGENT_MODEL,
        format: JobSpecSchema.toJSONSchema(),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildNormalizePrompt(prompt) }
        ]
      })
      const duration = performance.now() - start
      logger.debug({ duration }, "Normalize job")

      return { ok: true, data: JobSpecSchema.parse(JSON.parse(result.message.content)) }
    } catch (err) {
      logger.warn({ attempt, err }, "NORMALIZE attempt failed")

      if (attempt === maxAttempts) {
        logger.error(err, "Normalize failed")
        return {
          ok: false,
          error: {
            reason: err instanceof ZodError ? "SCHEMA_INVALID" : "MODEL_ERROR",
            message: err instanceof Error ? err.message : String(err)
          }
        }
      }
    }
  }

  throw new Error("Unreachable")
}
