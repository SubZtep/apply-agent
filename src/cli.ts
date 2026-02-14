import * as p from "@clack/prompts"
import { $ } from "bun"
import { defineCommand, runMain } from "citty"

// import { z } from "zod"

const cleanup = () => process.exit()

const run = defineCommand({
  meta: {
    name: "run",
    description: "Run job processing",
  },
  args: {
    orchestrator: {
      alias: "o",
      type: "boolean",
      // description: "Automatically run what needs to be run",
      description: "Where is the placeholder, here it is",
      default: true,
      negativeDescription: "Ignore it, always orchestrator for now",
    },
    mode: {
      type: "enum",
      description: "Exploratory mode is AI friendly, for Human-in-the-Loop go for (the default) strict mode",
      options: ["exploratory", "strict"],
      default: "strict",
    },
  },
  cleanup,
  async run({ args: { mode } }) {
    process.env.MODE = mode
    await $`bun run src/orchestrator.ts`
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
    p.intro("Configure")

    p.box(JSON.stringify(navigator))
    // navigator.geolocation.getCurrentPosition(success, error, options)

    p.outro("Bye")
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
