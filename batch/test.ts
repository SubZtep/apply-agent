import { join } from "node:path"

import { scoreJobs } from "./score"

const jobs = [
  {
    id: "1",
    title: "Lead Full-stack Developer",
    description: await Bun.file(join(import.meta.dirname, "..", "data", "job_ok.md")).text(),
  },
  {
    id: "2",
    title: "Cleaner",
    description: await Bun.file(join(import.meta.dirname, "..", "data", "job.md")).text(),
  },
]

const profileText = await Bun.file(join(import.meta.dirname, "..", "data", "cv.md")).text()

const res = await scoreJobs(jobs, profileText)
console.log(JSON.stringify(res, null, 2))
