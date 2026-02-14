declare module "bun" {
  interface Env {
    /** Base URL for OpenAI-compatible API endpoint (e.g., LM Studio, Ollama). */
    AI_API_BASE_URL: string

    /** Primary model for agent reasoning and possibly tool use (higher capability). */
    AGENT_MODEL: string

    /** Cost-effective model for high-volume batch scoring. */
    BATCH_MODEL: string

    /** Container for job status folders. */
    JOBS_DIR: string

    /** Your CV in _markdown_. */
    CV_FILE: string

    /**
     * If truthy, it won't ask for human input.
     * @deprecated use `process.env.MODE`
     */
    FORCE_PROCEED?: string

    /** Running mode, "strict" is for HITL. */
    MODE?: "exploratory" | "strict"

    /** Job search user config file location in YAML format. */
    CONFIG_FILE: string
  }
}
