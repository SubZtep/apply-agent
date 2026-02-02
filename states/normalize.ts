import { generateText, Output } from "ai"
import { ZodError, z } from "zod"
import { lmstudio } from "../lib/ai"
import { logger } from "../lib/logger"

const JobSpec = z.object({
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  senioritySignals: z.array(z.string()),
})

export type JobSpec = z.infer<typeof JobSpec>

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
  let rawOutput: unknown = undefined
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateText({
        model: lmstudio(process.env.NORMALIZE_MODEL!),
        output: Output.object({ schema: JobSpec }),
        system: SYSTEM_PROMPT,
        prompt: buildNormalizePrompt(prompt),
      })
      rawOutput = result.output
      return { ok: true, data: result.output }
    } catch (err: any) {
      logger.warn({ attempt, err }, "NORMALIZE attempt failed")
      if (attempt === maxAttempts) {
        logger.error(err, "Normalize failed")
        return {
          ok: false,
          error: {
            reason: err instanceof ZodError ? "SCHEMA_INVALID" : "MODEL_ERROR",
            message: err.message,
            rawOutput,
          },
        }
      }
    }
  }

  // unreachable, but TS likes it
  return {
    ok: false,
    error: {
      reason: "MODEL_ERROR",
      message: "Unexpected normalize failure",
      rawOutput,
    },
  }
}
