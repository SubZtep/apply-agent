import { readdir } from "node:fs/promises"
import { join } from "node:path"
import type { AgentStore, JobState } from "#/machine/types"
import type { Job } from "#/schemas/job"
import { logger } from "./logger"

export class FileAgentStore implements AgentStore {
  async save(job: Job, dir?: JobState, oldDir?: JobState | "inbox") {
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
      const oldFile = Bun.file(join(process.env.JOBS_DIR, oldDir, `${job.job.id}.json`))
      if (await oldFile.exists()) {
        try {
          await oldFile.delete()
        } catch (error: any) {
          logger.error({ file: oldFile, error, job }, "Failed to clean up old job file")
          throw error
        }
      }
    }
  }

  async load(id: string, dir: JobState | "inbox") {
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

export async function getAJob(dir: JobState | "inbox") {
  const jsonFilterFn =
    dir === "inbox"
      ? (fn: string) => fn.endsWith(".json") && !fn.startsWith("jobs.")
      : (fn: string) => fn.endsWith(".json")

  const fn = (await readdir(join(process.env.JOBS_DIR, dir))).filter(jsonFilterFn).pop()

  return { dir, id: fn?.replace(/\.json$/, "") }
}
