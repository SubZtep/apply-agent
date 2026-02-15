import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { box, intro, outro } from "@clack/prompts"
import { defineCommand } from "citty"

// import { cleanup } from "./lib"

const stats = defineCommand({
  meta: {
    name: "stats",
    description: "Display job statistics"
  },
  // cleanup,
  async run() {
    const data = await getJobCountPerFolder()
    intro("Scraped job statistics\n")
    box(
      Object.keys(data)
        .map(dir => {
          return `${dir}: ${data[dir]}`
        })
        .join("\n"),
      "Number of jobs",
      {
        rounded: true
      }
    )
    outro("Run me for more jobs🔧")
  }
})

export default stats

export async function getJobCountPerFolder() {
  const data = []
  const dirs = (await readdir(process.env.JOBS_DIR)).filter(dir => dir !== "inbox")
  for (const dir of dirs) {
    const files = await readdir(join(process.env.JOBS_DIR, dir))
    data.push([dir, files.length])
  }
  return Object.fromEntries(data) as Record<string, number>
}
