declare module "bun" {
  interface Env {
    /** Any OpenAI-compatible LLM API should work. */
    LM_STUDIO_BASE_URL: string
    EVALUATE_MODEL: string
    CHALLENGE_MODEL: string
  }
}
