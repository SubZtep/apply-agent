import { describe, expect, it } from "bun:test"
import { clamp, toFixed } from "#/lib/utils"
import { isShortlisted } from "#/lib/vars"
import type { Job } from "#/schemas/job"

describe("Scoring functions", () => {
  describe("clamp", () => {
    it("should clamp scores above 1.0 to 1.0", () => {
      expect(clamp(1.5)).toBe(1.0)
    })

    it("should clamp negative scores to 0.0", () => {
      expect(clamp(-0.5)).toBe(0.0)
    })

    it("should round to 2 decimal places", () => {
      expect(clamp(toFixed(0.567))).toBe(0.57)
    })

    it("should keep valid scores unchanged", () => {
      expect(clamp(0.5)).toBe(0.5)
      expect(clamp(0.75)).toBe(0.75)
    })
  })
})

describe("Shortlist Filtering", () => {
  it("should shortlist jobs with score > 0.4", () => {
    const testCases = [
      { score: 0.41, expected: true },
      { score: 0.5, expected: true },
      { score: 0.9, expected: true },
      { score: 1.0, expected: true }
    ]

    testCases.forEach(({ score, expected }) => {
      expect(isShortlisted(score)).toBe(expected)
    })
  })

  it("should screen out jobs with score <= 0.4", () => {
    const testCases = [
      { score: 0.0, expected: false },
      { score: 0.1, expected: false },
      { score: 0.4, expected: true },
      { score: 0.39, expected: false }
    ]

    testCases.forEach(({ score, expected }) => {
      expect(isShortlisted(score)).toBe(expected)
    })
  })

  it("should filter multiple jobs correctly", () => {
    const jobs: Job[] = [
      {
        job: {
          id: "1",
          title: "Dev",
          company: "Corp1",
          description: "Desc",
          location: "Remote",
          source: "LinkedIn",
          url: "https://example.com/1"
        },
        batch: { score: 0.6, signals: [], redFlags: [] }
      },
      {
        job: {
          id: "2",
          title: "Dev2",
          company: "Corp2",
          description: "Desc",
          location: "Remote",
          source: "LinkedIn",
          url: "https://example.com/2"
        },
        batch: { score: 0.3, signals: [], redFlags: [] }
      },
      {
        job: {
          id: "3",
          title: "Dev3",
          company: "Corp3",
          description: "Desc",
          location: "Remote",
          source: "LinkedIn",
          url: "https://example.com/3"
        },
        batch: { score: 0.5, signals: [], redFlags: [] }
      }
    ]

    const shortlisted = jobs.filter(job => job.batch && isShortlisted(job.batch.score))

    expect(shortlisted).toHaveLength(2)
    expect(shortlisted[0]?.job.id).toBe("1")
    expect(shortlisted[1]?.job.id).toBe("3")
  })
})
