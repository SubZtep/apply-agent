import { describe, expect, it } from "bun:test"
import { applyRedFlagPenalty, normalizeScore } from "#/batch/score"
import type { Job } from "#/schemas/job"

describe("Scoring functions", () => {
  describe("normalizeScore", () => {
    it("should clamp scores above 1.0 to 1.0", () => {
      expect(normalizeScore(1.5)).toBe(1.0)
    })

    it("should clamp negative scores to 0.0", () => {
      expect(normalizeScore(-0.5)).toBe(0.0)
    })

    it("should round to 2 decimal places", () => {
      expect(normalizeScore(0.567)).toBe(0.57)
    })

    it("should keep valid scores unchanged", () => {
      expect(normalizeScore(0.5)).toBe(0.5)
      expect(normalizeScore(0.75)).toBe(0.75)
    })
  })

  describe("applyRedFlagPenalty", () => {
    it("should subtract 0.1 per red flag", () => {
      const score = 0.7
      const redFlags = ["flag1", "flag2"]
      expect(applyRedFlagPenalty(score, redFlags)).toBe(0.5)
    })

    it("should not go below 0.0", () => {
      const score = 0.15
      const redFlags = ["flag1", "flag2", "flag3"]
      expect(applyRedFlagPenalty(score, redFlags)).toBe(0.0)
    })

    it("should return unchanged score when no red flags", () => {
      expect(applyRedFlagPenalty(0.6, [])).toBe(0.6)
    })

    it("should round result to 2 decimal places", () => {
      // 0.567 - 0.1 = 0.467 → rounds to 0.47
      expect(applyRedFlagPenalty(0.567, ["flag1"])).toBe(0.47)
    })
  })
})

describe("Shortlist Filtering", () => {
  function isShortlisted(batch: { score: number }) {
    return batch.score > 0.4
  }

  it("should shortlist jobs with score > 0.4", () => {
    const testCases = [
      { score: 0.41, expected: true },
      { score: 0.5, expected: true },
      { score: 0.9, expected: true },
      { score: 1.0, expected: true },
    ]

    testCases.forEach(({ score, expected }) => {
      expect(isShortlisted({ score })).toBe(expected)
    })
  })

  it("should screen out jobs with score <= 0.4", () => {
    const testCases = [
      { score: 0.0, expected: false },
      { score: 0.1, expected: false },
      { score: 0.4, expected: false },
      { score: 0.39, expected: false },
    ]

    testCases.forEach(({ score, expected }) => {
      expect(isShortlisted({ score })).toBe(expected)
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
          url: "https://example.com/1",
        },
        batch: { score: 0.6, signals: [], redFlags: [] },
      },
      {
        job: {
          id: "2",
          title: "Dev2",
          company: "Corp2",
          description: "Desc",
          location: "Remote",
          source: "LinkedIn",
          url: "https://example.com/2",
        },
        batch: { score: 0.3, signals: [], redFlags: [] },
      },
      {
        job: {
          id: "3",
          title: "Dev3",
          company: "Corp3",
          description: "Desc",
          location: "Remote",
          source: "LinkedIn",
          url: "https://example.com/3",
        },
        batch: { score: 0.5, signals: [], redFlags: [] },
      },
    ]

    const shortlisted = jobs.filter(job => job.batch && isShortlisted(job.batch))

    expect(shortlisted).toHaveLength(2)
    expect(shortlisted[0]?.job.id).toBe("1")
    expect(shortlisted[1]?.job.id).toBe("3")
  })
})
