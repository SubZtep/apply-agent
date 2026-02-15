import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { $ } from "bun"

while (true) {
  const hasJob = {
    scraped: async () => await Bun.file(join(process.env.JOBS_DIR, "inbox", "jobs.csv")).exists(),
    shortlisted: async () =>
      (await readdir(join(process.env.JOBS_DIR, "shortlisted"))).filter(f => f.endsWith(".json")).length > 0,
    awaiting: async () =>
      (await readdir(join(process.env.JOBS_DIR, "awaiting_input"))).filter(f => f.endsWith(".json")).length > 0
  }

  if (await hasJob.awaiting()) {
    console.log("🧑‍🎨 Answer questions")
    await $`bun run src/cli/answer.ts`
    process.exit()
  }

  if (!(await hasJob.scraped())) {
    console.log("🎣 Get jobs")
    await $`tools/scraper/run.sh`
  }

  if (await hasJob.scraped()) {
    console.log("🗄️ Filter the noise out")
    await $`bun run src/batch/run.ts`
  }

  if (await hasJob.shortlisted()) {
    console.log("🔮 Evaluate")
    await $`bun run src/machine/run.ts`
  }
}
