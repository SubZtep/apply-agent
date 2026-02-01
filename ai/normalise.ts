import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText, Output } from "ai"
import { z } from "zod"

const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://localhost:1234/v1",
  supportsStructuredOutputs: true,
})

export async function normalise(prompt: string) {
  const { output } = await generateText({
    model: lmstudio("qwen/qwen3-4b-2507"),
    output: Output.object({
      schema: z.object({
        skills: z.array(z.string()),
        responsibilities: z.array(z.string()),
        senioritySignals: z.array(z.string()),
        keywords: z.array(z.string()),
      }),
    }),
    system: `Extract structured data from the given text.
  Rules:
  - no opinions
  - no scoring
  - no advice
  `,
    prompt,
    maxRetries: 1,
  })
  return output
}
