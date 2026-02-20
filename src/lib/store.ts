import { readdir } from "node:fs/promises"
import { join } from "node:path"
import type { AgentState, Job, JobDir } from "#/schemas/job"
import { jobDir } from "./job"
import { logger } from "./logger"

export interface AgentStore {
  /** Omit id to pick a random job from the given dir. */
  load(dir: JobDir, id?: string): Promise<Job | null>
  save(job: Job, dir?: JobDir): Promise<void>
}

export class FileAgentStore implements AgentStore {
  async load(dir: JobDir, id?: string): Promise<Job | null> {
    let jobId: string

    if (!id) {
      const pid = await this.#pickJobId(dir)
      if (!pid) {
        logger.warn({ dir }, "No job found")
        return null
      }
      jobId = pid
    } else {
      jobId = id
    }

    const fn = join(jobDir(dir), `${jobId}.json`)
    const file = Bun.file(fn)

    if (!(await file.exists())) {
      logger.warn({ file: fn }, "File not found")
      return null
    }

    try {
      const job = (await file.json()) as Job
      await file.delete()
      return job
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return null
      }
      if (error instanceof SyntaxError) {
        logger.error({ fn, error }, "Corrupted data file for agent")
        return null
      }
      throw error
    }
  }

  async save(job: Job, dir?: JobDir): Promise<void> {
    if (!dir && !job.agent?.state) {
      throw new Error("Unable to save job without state")
    }
    const fn = join(jobDir(dir ?? this.#stateToDir(job.agent!.state)), `${job.job.id}.json`)
    try {
      await Bun.write(fn, JSON.stringify(job, null, 2))
    } catch (error) {
      logger.error({ file: fn, error, job }, "Job save failed")
      throw error
    }
  }

  async #pickJobId(dir: JobDir) {
    const jsonFilterFn: (fn: string) => boolean =
      dir === "inbox" ? fn => fn.endsWith(".json") && !fn.startsWith("jobs.") : fn => fn.endsWith(".json")
    return (await readdir(jobDir(dir)))
      .filter(jsonFilterFn)
      .pop()
      ?.replace(/\.json$/, "")
  }

  #stateToDir(state: AgentState) {
    return state === "WAIT_FOR_HUMAN"
      ? "awaiting_input"
      : state === "DONE"
        ? "approved"
        : state === "FAILED"
          ? "declined"
          : "shortlisted"
  }
}
