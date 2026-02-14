import { join } from "node:path"
import type { AgentStore, JobState } from "#/machine/types"
import type { Job } from "#/schemas/job"
import { logger } from "./logger"

export class FileAgentStore implements AgentStore {
  async save(job: Job, dir?: JobState, oldDir?: JobState) {
    const stateDir = dir ?? job.agent?.state
    if (!stateDir) {
      logger.error({ job, dir }, "Can't save without state dir")
      throw new Error("Missing job state")
    }

    const fileName = join(process.env.JOBS_DIR, stateDir, `${job.job.id}.json`)
    try {
      await Bun.write(fileName, JSON.stringify(job, null, 2))
    } catch (error: any) {
      logger.error({ fileName, error, job }, "Failed to save agent")
      throw error
    }

    if (oldDir) {
      const oldFileName = join(process.env.JOBS_DIR, oldDir, `${job.job.id}.json`)
      try {
        await Bun.file(oldFileName).delete()
      } catch (error: any) {
        logger.error({ oldFileName, error, job }, "Failed to clean up old job file")
        throw error
      }
    }
  }

  async load(id: string, dir: JobState) {
    const file = Bun.file(join(process.env.JOBS_DIR, dir, `${id}.json`))
    if (!(await file.exists())) {
      return null
    }
    try {
      return (await file.json()) as Job
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
