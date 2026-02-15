import { cancel, intro, note } from "@clack/prompts"
import { defineCommand, runMain } from "citty"
import config from "./commands/config"
import run from "./commands/run"
import stats from "./commands/stats"

const main = defineCommand({
  meta: {
    name: "apply-agent",
    description: "Job finder app",
  },
  subCommands: {
    run,
    stats,
    config,
  },
  async run() {
    intro("Welcome to a better job centr@!😒")
    note("Please run me again with the --help option\nto see all the available commands")
    cancel("Bye")
  },
})

runMain(main)
