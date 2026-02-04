import { join } from "node:path"
import Papa from "papaparse"
import { scoreJobs } from "./score"
import type { BatchJob } from "./types"

const jobs: BatchJob[] = []

const csv = Bun.file(join(import.meta.dirname, "..", "data", "jobs", "inbox", "jobs.csv"))
if (!(await csv.exists())) {
  throw new Error("Please scrape some jobs first.")
}

const profileText = await Bun.file(join(import.meta.dirname, "..", "data", "cv.md")).text()

interface Job {
  job_url: string
  site: string
  title: string
  company: string
  location: string
  job_type: string
  date_posted: string
  interval: string
  min_amount: string
  max_amount: string
  currency: string
  is_remote: string
  num_urgent_words: string
  benefits: string
  emails: string
  description: string
}

Papa.parse<Job>(await csv.text(), {
  header: true,
  skipEmptyLines: true,
  complete: ({ data }) => {
    data.forEach(job => {
      jobs.push({
        id: encodeURIComponent(job.job_url),
        title: job.title,
        description: job.description,
      })
      console.log(encodeURIComponent(job.job_url))
    })
  },
})

const res = await scoreJobs(jobs, profileText)
console.log(JSON.stringify(res, null, 2))
