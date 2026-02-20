import { scoreSingleJob } from "#/score/score"
import { test, expect } from "bun:test"

test("Job scoring", async() => {
  const job = {
    "title": "Full-stack web developer",
    "description": "If you're a very experienced dev, please join our team and help to fix our Amazon services and legacy Cobol nightmare. We use tons of language, like C, Python, JS/TS.",
  }

  const profile = "I like to work with legacy code in C and Python since I'm senior by age, fix AWS nightmares with JavaScript and write back-end TypeScript with React front-end, but I hate Cobol and never want to touch it."

  const res = await scoreSingleJob(job, profile)

  expect(res.score).toBeGreaterThanOrEqual(0.3)
  expect(res.score).toBeLessThanOrEqual(0.7)
  expect(res.signals).toContain("python")
  expect(res.redFlags).toContain("cobol")
})
