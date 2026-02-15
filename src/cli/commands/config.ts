import { box, cancel, intro } from "@clack/prompts"
import { defineCommand } from "citty"
import { cleanup } from "./lib"

const config = defineCommand({
  meta: {
    name: "config",
    description: "Interactive setup and validation😖",
  },
  cleanup,
  async run() {
    intro("Configure\n")
    box(
      `Feel free to update text files manually — like an animal.
See more details in the repo: docs/config.md`,
      "While this feature isn’t complete yet,",
      { titlePadding: 0, contentPadding: 0, rounded: true },
    )
    cancel("Bye")
  },
})

export default config
