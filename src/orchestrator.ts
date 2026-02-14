import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { $ } from "bun"

const hasScrapedJobs = async () => await Bun.file(join(process.env.JOBS_DIR, "inbox", "jobs.csv")).exists()
const hasShortlistedJobs = async () =>
  (await readdir(join(process.env.JOBS_DIR, "shortlisted"))).filter(f => f.endsWith(".json")).length > 0

if (!(await hasScrapedJobs())) {
  console.log("🎣 Get jobs")
  await $`tools/scraper/run.sh`
}

if (await hasScrapedJobs()) {
  console.log("🗄️ Filter the noise out")
  await $`bun run src/batch/run.ts`
}

if (await hasShortlistedJobs()) {
  console.log("🔮 Evaluate")
  await $`bun run src/cli/run.ts`
}
