import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

export const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: process.env.AI_API_BASE_URL,
  supportsStructuredOutputs: true,
})
