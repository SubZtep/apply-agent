import { $ } from "bun"
import { defineCommand } from "citty"
import { cleanup } from "./lib"

const run = defineCommand({
  meta: {
    name: "run",
    description: "Run job processing",
  },
  args: {
    mode: {
      type: "enum",
      default: "strict",
      options: ["exploratory", "strict"],
      description: "Exploratory mode is AI friendly, for Human-in-the-Loop go for (the default) strict mode",
    },
    step: {
      type: "enum",
      options: ["scrape", "batch", "evaluate", "answers"],
      description: "If this optional parameter is missing, the orchestrator runs its scheduled steps",
    },
  },
  cleanup,
  async run({ args: { mode, step } }) {
    process.env.MODE = mode
    switch (step) {
      case "scrape":
        await $`tools/scraper/run.sh`
        break
      case "batch":
        await $`bun run src/batch/run.ts`
        break
      case "evaluate":
        await $`bun run src/machine/run.ts`
        break
      case "answers":
        await $`bun run src/cli/answer.ts`
        break
      default:
        await $`bun run src/cli/orchestrator.ts`
        break
    }
  },
})

export default run
