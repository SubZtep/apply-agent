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
  async run() {
    console.log("COPMG YEYEYEYE")
    process.exit()
  },
})

const configure = defineCommand({
  meta: {
    name: "configure",
    description: "Interactive setup and validation",
  },
  async run() {
    console.log("RURURURN YEYEYEYE")
    process.exit()
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
    p.note("Please run me again with the --help option\nto see the available commands.")
    p.cancel("Bye")
  },
})

runMain(main)
