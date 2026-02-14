import { describe, expect, it } from "bun:test"
import { decideNextState } from "#/machine/next"
import type { Job } from "#/schemas/job"

describe("State Machine Flow Integration", () => {
  it("should flow: no gaps → PLAN", () => {
    const job: Job = {
      job: {
        id: "job-1",
        source: "linkedin",
        title: "Dev",
        company: "Corp",
        description: "Job",
        url: "https://example.com",
        location: "Remote",
      },
      agent: {
        mode: "strict",
        state: "DECIDE",
        evaluation: {
          requirements: [
            { requirement: "TypeScript", confidence: 0.95, evidence: "Expert" },
            { requirement: "React", confidence: 0.9, evidence: "Expert" },
          ],
        },
        risks: {
          hardGaps: [],
          softGaps: ["Leadership"],
          mitigations: ["Mentorship"],
        },
      },
    }

    const { nextState } = decideNextState(job)
    expect(nextState).toBe("PLAN")
  })

  it("should flow: hard gaps unanswered in strict mode → WAIT_FOR_HUMAN", () => {
    const job: Job = {
      job: {
        id: "job-1",
        source: "linkedin",
        title: "Dev",
        company: "Corp",
        description: "Job",
        url: "https://example.com",
        location: "Remote",
      },
      agent: {
        mode: "strict",
        state: "DECIDE",
        evaluation: {
          requirements: [{ requirement: "Kubernetes", confidence: 0.1, evidence: "None" }],
        },
        risks: {
          hardGaps: ["Kubernetes", "Docker", "Cloud"],
          softGaps: [],
          mitigations: [],
        },
      },
    }

    const { nextState, questions } = decideNextState(job)
    expect(nextState).toBe("WAIT_FOR_HUMAN")
    expect(questions?.length).toBeGreaterThan(0)
  })

  it("should flow: hard gaps declined → FAILED", () => {
    const job: Job = {
      job: {
        id: "job-1",
        source: "linkedin",
        title: "Dev",
        company: "Corp",
        description: "Job",
        url: "https://example.com",
        location: "Remote",
      },
      agent: {
        mode: "strict",
        state: "DECIDE",
        evaluation: {
          requirements: [{ requirement: "Kubernetes", confidence: 0.1, evidence: "None" }],
        },
        risks: {
          hardGaps: ["Kubernetes", "Docker", "Cloud"],
          softGaps: [],
          mitigations: [],
        },
        humanInput: {
          answers: {
            HARD_GAPS_PROCEED: "no",
          },
        },
      },
    }

    const { nextState } = decideNextState(job)
    expect(nextState).toBe("FAILED")
  })

  it("should flow: exploratory mode ignores unanswered questions", () => {
    const job: Job = {
      job: {
        id: "job-1",
        source: "linkedin",
        title: "Dev",
        company: "Corp",
        description: "Job",
        url: "https://example.com",
        location: "Remote",
      },
      agent: {
        mode: "exploratory",
        state: "DECIDE",
        evaluation: {
          requirements: [
            { requirement: "Kubernetes", confidence: 0.1, evidence: "None" },
            { requirement: "Docker", confidence: 0.2, evidence: "None" },
          ],
        },
        risks: {
          hardGaps: ["Kubernetes", "Docker", "Cloud"],
          softGaps: [],
          mitigations: [],
        },
      },
    }

    const { nextState } = decideNextState(job)
    expect(nextState).toBe("PLAN")
  })
})
