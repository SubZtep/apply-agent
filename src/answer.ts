import { FileAgentStore } from "#/lib/store"
import { logger } from "./lib/logger"
import type { Job } from "./schemas/job"

const id = Bun.argv[2]
let job: Job | null
const store = new FileAgentStore()

do {
  job = await store.load("awaiting_input", id)

  if (job) {
    logger.trace({ id: job.job.id }, "Answer question")

    console.log(`\nAnswer the questions for ${job.job.title}:`)
    console.log("(Press Enter to skip a question)\n")

    const answers: Record<string, string> = {}
    for (const q of job.agent!.questions || []) {
      const answer = prompt(`${q.text}\n> `)
      answers[q.id] = answer ?? ""
    }

    // Human input is only consumed by DECIDE state
    job.agent!.state = "DECIDE"
    job.agent!.humanInput = { answers }

    await store.save("shortlisted", job)
  }
} while (job)
