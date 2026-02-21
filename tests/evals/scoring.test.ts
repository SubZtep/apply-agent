import { describe, expect, it } from "bun:test"
import { scoreSingleJob } from "#/score/score"

describe("scoreSingleJob", () => {
  it("high overlap should score high", async () => {
    const job = {
      title: "Senior Backend Engineer",
      description: `
        Must have Python
        Strong experience with AWS
        Senior level role
      `
    }

    const profile = `
      Senior engineer
      Python backend developer
      Worked with AWS
    `

    const result = await scoreSingleJob(job, profile)
    expect(result.score).toBeGreaterThan(0.6)
  })

  it("missing required skill should penalize", async () => {
    const job = {
      title: "Backend Engineer",
      description: `
        Must have Cobol
      `
    }

    const profile = `
      Senior Python developer
    `

    const result = await scoreSingleJob(job, profile)

    expect(result.score).toBeLessThan(0.5)
  })
})
