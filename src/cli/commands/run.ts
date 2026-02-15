import { spinner } from "@clack/prompts"
import { $ } from "bun"
import { defineCommand } from "citty"

const run = defineCommand({
  meta: {
    name: "run",
    description: "Run job processing"
  },
  args: {
    mode: {
      type: "enum",
      default: "strict",
      options: ["exploratory", "strict"],
      description: "Exploratory mode is AI friendly, for Human-in-the-Loop go for (the default) strict mode"
    },
    step: {
      type: "enum",
      options: ["scrape", "batch", "evaluate", "answers"],
      description: "If this optional parameter is missing, the orchestrator runs its scheduled steps"
    }
  },
  async run({ args: { mode, step } }) {
    const spin = spinner()
    spin.start(`Processing ${mode}`)
    let command: string
    process.env.MODE = mode

    switch (step) {
      case "scrape":
        command = `tools/scraper/run.sh`
        break
      case "batch":
        command = `bun run src/batch/run.ts`
        break
      case "evaluate":
        command = `bun run src/machine/run.ts`
        break
      case "answers":
        command = `bun run src/cli/answer.ts`
        break
      default:
        command = `bun run src/cli/orchestrator.ts`
        break
    }
    const output = await $`${command}`.text()
    spin.stop(`Processing ${mode}; ${output.trim()} ⛱️`)
  }
})

export default run
