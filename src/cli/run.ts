import { intro, outro } from "@clack/prompts"
import { defineCommand, runMain } from "citty"
import { logger } from "#/lib/logger"
import config from "./commands/config"
import run from "./commands/run"
import stats from "./commands/stats"

logger.info("Hello, world!")

const main = defineCommand({
  meta: {
    name: "apply-agent",
    description: "Job finder app"
  },
  subCommands: {
    run,
    stats,
    config
  }
})

intro("🏁")
await runMain(main)
outro("🫧")
