import { getInitialJobState } from "#/lib/spoilinger"
import { FileAgentStore } from "#/lib/store"
import { runSateMachine } from "#/machine/runner"

const store = new FileAgentStore()

const job = await store.load("shortlisted")

console.log("ccc", job)

if (job) {
  if (!job.agent) {
    job.agent = getInitialJobState()
  }

  // @ts-expect-error
  await runSateMachine(job, store)
}

// const pickDir: JobState = "shortlisted"
// const dir = join(process.env.JOBS_DIR, pickDir)

// while (true) {
// const jobIds: string[] = (await readdir(dir)).filter(f => f.endsWith(".json")).map(f => f.slice(0, -5))

// if (jobIds.length === 0) {
//   logger.info("No more batched job")
//   break
// }

// const randomJobId = jobIds[Math.floor(Math.random() * jobIds.length)]!
// const job = await store.load(randomJobId, pickDir)
// if (!job) {
//   logger.warn({ randomJobId, pickDir }, "Ghosted job")
//   continue
// }

// if (!job.agent) {
//   job.agent = {
//     mode: process.env.MODE ?? (process.env.FORCE_PROCEED ? "exploratory" : "strict"),
//     state: "IDLE"
//   }
// }

// console.log("CCC", dir)
// process.exit()

///////

////

///////

// const { id, dir } = await getAJob("shortlisted")
// if (dir && id) {
//   const job = await store.load(id, dir)
//   if (job) {
//     //   job.agent = {
//     //     mode: process.env.MODE ?? (process.env.FORCE_PROCEED ? "exploratory" : "strict"),
//     //     state: "IDLE"
//     //   }

//     if (!job.agent) {
//       job.agent = getInitialJobState()
//     }
//     // job.agent = getInitialJobState()

//     console.log("DD", job)

//     // @tsxxx-ignore
//     await runATick(job, store)
//   }
// }

//////

///////

/////////

// process.exit()

// async function getJob(state: JobState) {
//   console.log("CCC", join(process.env.JOBS_DIR, dir))
//   process.exit()
//   const jobId = (await readdir(join(process.env.JOBS_DIR, dir))).filter(f => f.endsWith(".json")).pop()
//   // const jobId = (await readdir(join(process.env.JOBS_DIR, dir))).filter(f => f.endsWith(".json")).pop()
//   if (jobId) {
//     const job = await store.load(jobId, state)
//     if (job) {
//       return job
//     }
//   }
//   // throw new Error("No job")
//   process.exit()
// }
