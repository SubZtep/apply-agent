// import { join } from "node:path"

import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText, Output } from "ai"
import { ZodError } from "zod"
import { logger } from "../logger"
import { JobSpec } from "../states/normalize"

const SYSTEM_PROMPT = `Extract structured data from the given text.
Rules:
- no opinions
- no scoring
- no advice
`

interface NormalizeError {
  reason: "SCHEMA_INVALID" | "MODEL_ERROR"
  message: string
  rawOutput?: unknown
}

type NormalizeResult = { ok: true; data: JobSpec } | { ok: false; error: NormalizeError }

const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://localhost:1234/v1",
  supportsStructuredOutputs: true,
})

export async function normalizeWithRetry(prompt: string, maxAttempts = 3): Promise<NormalizeResult> {
  let rawOutput: unknown = undefined
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await generateText({
        model: lmstudio("qwen/qwen3-4b-2507"),
        output: Output.object({ schema: JobSpec }),
        system: SYSTEM_PROMPT,
        prompt,
      })
      rawOutput = result.output
      return { ok: true, data: result.output }
    } catch (err: any) {
      logger.warn({ attempt }, "Normalize attempt failed")
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

// const jobText = await Bun.file(join(import.meta.dirname, "..", "data", "job.txt")).text()
// const testRes = await normalizeWithRetry(jobText, 1)
// console.log(testRes)
// process.exit(0)
