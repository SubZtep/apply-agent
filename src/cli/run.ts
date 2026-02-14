import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { logger } from "#/lib/logger"
import { FileAgentStore } from "#/lib/store"
import { runAgent } from "#/machine/runner"
import type { JobState } from "#/machine/types"

const store = new FileAgentStore()

// const [, , fileName, forceProceed] = Bun.argv
// const file = Bun.file(join(JOBS_DIR, "agentworks"))

// if (!file.exists()) {
//   logger.error({ fileName }, "Agentwork corrupted")
//   throw new Error("Where is my job?")
// }

// const _job: Job = await file.json()

const forceProceed = true
const pickDir: JobState = "shortlisted"
const dir = join(process.env.JOBS_DIR, pickDir)

while (true) {
  const jobIds: string[] = (await readdir(dir)).filter(f => f.endsWith(".json")).map(f => f.slice(0, -5))

  if (jobIds.length === 0) {
    logger.info("No more batched job")
    break
  }

  const randomJobId = jobIds[Math.floor(Math.random() * jobIds.length)]!

  const job = (await store.load(randomJobId, pickDir))!

  job.agent = {
    mode: forceProceed ? "exploratory" : "strict",
    state: "IDLE",
  }

  await runAgent(job, store)
}

// async function cmdRun(isExploratoryMode = false) {
//   // const context: AgentContext = {
//   //   mode: isExploratoryMode ? "exploratory" : "strict",
//   //   jobText: await Bun.file(join(import.meta.dirname, "..", "data", "job.md")).text(),
//   //   profileText: await Bun.file(join(import.meta.dirname, "..", "data", "cv.md")).text(),
//   // }
//   // const id = Bun.randomUUIDv7()
//   // const id = await getRandomScoredId();
//   // console.log("Xxxx", id);
//   const job = await getRandomScoredJob();
//   console.log("SSSS", job);

//   if (job == null) {
//     logger.info("No shortlisted jobs found");
//     return;
//   }
//   // else {
//   //   logger.info({ id: job.job.id }, "Starting new agent");
//   // }

//   console.log("XXXXXXXXX", job);
//   return;

//   const profileText = await Bun.file(join(DATA_DIR, "cv.md")).text();

//   const context: AgentContext = {
//     mode: isExploratoryMode ? "exploratory" : "strict",
//     profileText,
//     jobText: job.job.description,
//     // jobText: await Bun.file(
//     //   join(import.meta.dirname, "..", "data", "job.md"),
//     // ).text(),
//     // profileText: await Bun.file(
//     //   join(import.meta.dirname, "..", "data", "cv.md"),
//     // ).text(),
//   };

//   await runAgent(
//     { id: job.job.id, state: "IDLE", context, updatedAt: Date.now() },
//     store,
//   );

//   // const persisted = await store.load(id);
//   // if (persisted?.state === "WAIT_FOR_HUMAN") {
//   //   console.log("\n⏸ Agent paused — input required\n");
//   //   persisted.context.questions?.forEach((q, i) => {
//   //     console.log(`${i + 1}. ${q.text}`);
//   //   });
//   //   console.log(`\nRun: bun start answer ${id}`);
//   // }
// }

// async function cmdAnswer(agentId: string, forceProceed = false) {
//   const persisted = await store.load(agentId);
//   if (!persisted) {
//     console.log("Agent not found");
//     process.exit(1);
//   }
//   if (persisted.state === "WAIT_FOR_HUMAN") {
//     const answers: Record<string, string> = {};

//     console.log("\nAnswer the questions:");
//     console.log("(Press Enter to skip a question)\n");
//     for (const q of persisted.context.questions || []) {
//       const answer = prompt(`${q.text}\n> `);
//       answers[q.id] = answer ?? "";
//     }

//     // Human input is only consumed by DECIDE state
//     persisted.state = "DECIDE";
//     persisted.context.humanInput = { answers, forceProceed };
//     await store.save(persisted);
//   }

//   console.log("\nResuming agent...");
//   await runAgent(persisted, store);
// }

// const [, , command, agentId, forceProceed] = Bun.argv;

// if (command === "run") {
//   const isExploratoryMode = agentId === "x";
//   await cmdRun(isExploratoryMode);
// } else if (command === "answer" && agentId) {
//   await cmdAnswer(agentId, forceProceed === "--force-proceed");
// } else {
//   console.log(
//     "Usage: bun start run\n       bun start answer <agentId> [--force-proceed]\n",
//   );
//   process.exit(0);
// }

// console.log("");
// process.exit();

// async function getRandomScoredJob() {
//   let dir: string[];
//   try {
//     dir = await readdir(join(DATA_DIR, "jobs", "shortlisted"));
//     // console.log("WDFGVERDHBRTFGHBNRTGF", dir);
//   } catch {
//     return null;
//   }
//   const files = dir.filter((f) => f.endsWith(".json"));
//   const randomFn = files[Math.floor(Math.random() * files.length)]!;
//   // console.log("fwerfwer", { dir, files, randomFn });
//   // const file = Bun.file(randomFn);
//   // if (await file.exists()) {
//   //   return (await file.json()) as Job;
//   // }
//   // return null;
//   // return randomFn.split(".").shift();
// }
