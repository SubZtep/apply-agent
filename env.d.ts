declare module "bun" {
  interface Env {
    /** Base URL for OpenAI-compatible API endpoint (e.g., LM Studio, Ollama). */
    AI_API_BASE_URL: string

    /** Primary model for agent reasoning and possibly tool use (higher capability). */
    AGENT_MODEL: string

    /** Cost-effective model for high-volume batch scoring. */
    BATCH_MODEL: string
  }
}
