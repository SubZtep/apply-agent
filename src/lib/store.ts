import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import type { AgentStore, PersistedAgent } from "#/machine/types"
import { logger } from "./logger"

const STORE_DIR = join(process.env.JOBS_DIR, "agent")

export class FileAgentStore implements AgentStore {
  async save(agent: Parameters<AgentStore["save"]>[0]) {
    const merged: PersistedAgent = {
      ...agent,
      updatedAt: agent.updatedAt ?? Date.now(),
    }
    const name = join(STORE_DIR, `${merged.id}.json`)
    try {
      await mkdir(STORE_DIR, { recursive: true })
      await Bun.write(name, JSON.stringify(merged, null, 2))
      return merged
    } catch (error: any) {
      logger.error({ id: merged.id, error }, "Failed to save agent")
      throw error
    }
  }

  async load(id: string) {
    const file = Bun.file(join(STORE_DIR, `${id}.json`))
    if (!(await file.exists())) {
      return null
    }
    try {
      return (await file.json()) as PersistedAgent
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return null
      }
      if (error instanceof SyntaxError) {
        logger.error({ id, error }, "Corrupted data file for agent")
        return null
      }
      throw error
    }
  }
}
