import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

export const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: process.env.LM_STUDIO_BASE_URL!,
  supportsStructuredOutputs: true,
})
