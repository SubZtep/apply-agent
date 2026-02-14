import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { logger } from "#/lib/logger"
import { FileAgentStore } from "#/lib/store"
import type { JobState } from "#/machine/types"

const store = new FileAgentStore()
const pickDir: JobState = "awaiting_input"
const dir = join(process.env.JOBS_DIR, pickDir)

while (true) {
  const jobIds: string[] = (await readdir(dir)).filter(f => f.endsWith(".json")).map(f => f.slice(0, -5))

  if (jobIds.length === 0) {
    logger.info("No more awaiting job")
    break
  }

  const randomJobId = jobIds[Math.floor(Math.random() * jobIds.length)]!
  const job = await store.load(randomJobId, pickDir)
  if (!job) {
    logger.warn({ randomJobId, pickDir }, "Ghosted unanswered job")
    continue
  }

  if (!job.agent) {
    throw new Error("Invalid job awaiting")
  }

  const answers: Record<string, string> = {}

  console.log(`\nAnswer the questions for ${job.job.title}:`)
  console.log("(Press Enter to skip a question)\n")
  for (const q of job.agent.questions || []) {
    const answer = prompt(`${q.text}\n> `)
    answers[q.id] = answer ?? ""
  }

  // Human input is only consumed by DECIDE state
  job.agent.state = "DECIDE"
  job.agent.humanInput = { answers }

  await store.save(job, "shortlisted", "awaiting_input")
}
