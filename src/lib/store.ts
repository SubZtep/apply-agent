import { readdir } from "node:fs/promises"
import { join } from "node:path"
import type { AgentStore, JobState } from "#/machine/types"
import type { Job } from "#/schemas/job"
import { logger } from "./logger"

export class FileAgentStore implements AgentStore {
  dir: JobState | "inbox"

  constructor(dirToProcess: JobState | "inbox") {
    this.dir = dirToProcess
  }

  async save(job: Job, moveTo: JobState) {
    const fileName = join(process.env.JOBS_DIR, moveTo, `${job.job.id}.json`)
    try {
      await Bun.write(fileName, JSON.stringify(job, null, 2))
      await Bun.file(join(process.env.JOBS_DIR, this.dir, `${job.job.id}.json`)).delete()
    } catch (error: any) {
      logger.error({ fileName, error, job }, "Failed to save agent")
      throw error
    }
  }

  async load(id?: string) {
    const fn = id ? `${id}.json` : await this.#getAJobFn()
    if (!fn) return null
    const fullFn = join(process.env.JOBS_DIR, this.dir, fn)

    const file = Bun.file(fullFn)
    if (!(await file.exists())) return null

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

  async #getAJobFn() {
    if (!this.dir) return

    const jsonFilterFn =
      this.dir === "inbox"
        ? (fn: string) => fn.endsWith(".json") && !fn.startsWith("jobs.")
        : (fn: string) => fn.endsWith(".json")

    return (await readdir(join(process.env.JOBS_DIR, this.dir))).filter(jsonFilterFn).pop()
  }
}

// export async function getAJob(dir: JobState | "inbox") {
//   const jsonFilterFn =
//     dir === "inbox"
//       ? (fn: string) => fn.endsWith(".json") && !fn.startsWith("jobs.")
//       : (fn: string) => fn.endsWith(".json")

//   const fn = (await readdir(join(process.env.JOBS_DIR, dir))).filter(jsonFilterFn).pop()

//   return { dir, id: fn?.replace(/\.json$/, "") }
// }

////////

////////

//////

// import { readdir } from "node:fs/promises"
// import { join } from "node:path"
// import type { AgentStore, JobState } from "#/machine/types"
// import type { Job, JobSpecSchema } from "#/schemas/job"
// import { logger } from "./logger"

// export class FileAgentStore implements AgentStore {
//   #dir: JobState | "inbox"

//   constructor(dirToProcess: JobState | "inbox") {
//     this.#dir = dirToProcess
//   }

//   async save(job: Job, dir?: JobState, oldDir?: JobState | "inbox") {
//     const stateDir = dir ?? job.agent?.state
//     // if (!stateDir) {
//     //   logger.error({ job, dir }, "Can't save without state dir")
//     //   throw new Error("Missing job state")
//     // }

//     const fileName = join(process.env.JOBS_DIR, stateDir, `${job.job.id}.json`)
//     try {
//       await Bun.write(fileName, JSON.stringify(job, null, 2))
//     } catch (error: any) {
//       logger.error({ fileName, error, job }, "Failed to save agent")
//       throw error
//     }

//     if (oldDir) {
//       const oldFile = Bun.file(join(process.env.JOBS_DIR, oldDir, `${job.job.id}.json`))
//       if (await oldFile.exists()) {
//         try {
//           await oldFile.delete()
//         } catch (error: any) {
//           logger.error({ file: oldFile, error, job }, "Failed to clean up old job file")
//           throw error
//         }
//       }
//     }
//   }

//   async load(id?: string, _dir?: JobState | "inbox") {
//     const fileName = id ? join(process.env.JOBS_DIR, this.#dir, `${id}.json`) : await this.#getAJobFn()
//     if (!fileName) return null
//     // if (this.#dir) {
//     //   if (id) {
//     //     fn = join(process.env.JOBS_DIR, /*dir*/ this.#dir, `${id}.json`)
//     //   } else {
//     //   }
//     //   // const fn = id ? join(process.env.JOBS_DIR, /*dir*/ this.#dir, `${id}.json`) : await this.#getAJobFn()
//     // }

//     // let fn: string
//     // if (!id && this.#dir) {
//     //   fn = this.#getAJobFn()
//     // } else {
//     //   fn = join(process.env.JOBS_DIR, /*dir*/this.#dir, `${id}.json`)
//     // }

//     const file = Bun.file(fileName)
//     // const file = Bun.file(join(process.env.JOBS_DIR, dir, `${id}.json`))
//     if (!(await file.exists())) {
//       return null
//     }

//     try {
//       return (await file.json()) as Job
//     } catch (error: any) {
//       if (error.code === "ENOENT") {
//         return null
//       }
//       if (error instanceof SyntaxError) {
//         logger.error({ id, error }, "Corrupted data file for agent")
//         return null
//       }
//       throw error
//     }
//   }

//   async #getAJobFn() {
//     if (!this.#dir) return

//     const jsonFilterFn =
//       this.#dir === "inbox"
//         ? (fn: string) => fn.endsWith(".json") && !fn.startsWith("jobs.")
//         : (fn: string) => fn.endsWith(".json")

//     return (await readdir(join(process.env.JOBS_DIR, this.#dir))).filter(jsonFilterFn).pop()
//     // const fn = (await readdir(join(process.env.JOBS_DIR, this.#dir))).filter(jsonFilterFn).pop()
//     // if (fn) {
//     //   return this.load()
//     // }

//     // return null
//     // // return { dir, id: fn?.replace(/\.json$/, "") }
//   }
// }

// // export async function getAJob(dir: JobState | "inbox") {
// //   const jsonFilterFn =
// //     dir === "inbox"
// //       ? (fn: string) => fn.endsWith(".json") && !fn.startsWith("jobs.")
// //       : (fn: string) => fn.endsWith(".json")

// //   const fn = (await readdir(join(process.env.JOBS_DIR, dir))).filter(jsonFilterFn).pop()

// //   return { dir, id: fn?.replace(/\.json$/, "") }
// // }
