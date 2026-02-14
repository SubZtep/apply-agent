import * as p from "@clack/prompts"
import { defineCommand, runMain } from "citty"
import { z } from "zod"

const run = defineCommand({
  meta: {
    name: "run",
    description: "Run job processing",
  },
  args: {
    orchestrator: {
      alias: "o",
      type: "boolean",
      description: "Automatically run what needs to be run",
      default: false,
    },
    mode: {
      type: "enum",
      description: "Sometimes it asks things in strict mode",
      options: ["exploratory", "strict"],
      default: "strict",
    },
  },
  setup({ args }) {
    p.box("Setup", JSON.stringify(args))
  },
  cleanup({ args }) {
    p.box("Cleanup", JSON.stringify(args))
    process.exit()
  },
  run({ args }) {
    p.box("Run", JSON.stringify(args))
  },
})

const configure = defineCommand({
  meta: {
    name: "configure",
    description: `Interactive setup and validation.😖
For LLM API, the running models, and various path settings,
please update values from .env into .env.local file by hand.`,
  },
  cleanup() {
    process.exit()
  },
  async run() {
    p.intro("Configure")

    p.outro("Bye")
    // console.log("RURURURN YEYEYEYE")
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
