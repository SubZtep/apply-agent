import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { Ollama } from "ollama"

export const lmstudio = () =>
  createOpenAICompatible({
    name: "lmstudio",
    baseURL: process.env.OPENAI_API_BASE_URL,
    supportsStructuredOutputs: true
  })

export const ollama = () => new Ollama({ host: process.env.OLLAMA_BASE_URL })
