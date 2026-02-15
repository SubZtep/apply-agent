import * as p from "@clack/prompts"
import { $ } from "bun"
import { defineCommand, runMain } from "citty"

const cleanup = () => process.exit()

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
        await $`bun run src/cli/run.ts`
        break
      case "answers":
        await $`bun run src/cli/answer.ts`
        break
      default:
        await $`bun run src/orchestrator.ts`
        break
    }
  },
})

const configure = defineCommand({
  meta: {
    name: "configure",
    description: `Interactive setup and validation.😖
For LLM API, the running models, and various path settings,
please update values from .env into .env.local file by hand.`,
  },
  cleanup,
  async run() {
    p.intro("Configure\n")
    p.box(
      `Feel free to update text files manually — like an animal.
See more details in the repo: docs/config.md`,
      "While this feature isn’t complete yet,",
      { titlePadding: 0, contentPadding: 0, rounded: true },
    )
    p.cancel("Bye")
  },
})

const main = defineCommand({
  meta: {
    name: "apply-agent",
    description: "Job finder app",
  },
  subCommands: {
    run,
    configure,
  },
  async run() {
    p.intro("Welcome to a better job centr@!😒")
    p.note("Please run me again with the --help option\nto see all the available commands.")
    p.cancel("Bye")
  },
})

runMain(main)
