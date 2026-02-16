import { describe, expect, it, mock } from "bun:test"
import { handlers } from "#/machine/handlers"
import { decideNextState } from "#/machine/next"
import { runSateMachine } from "#/machine/runner"
import type { AgentStore } from "#/machine/types"
import type { Job } from "#/schemas/job"

describe("decideNextState", () => {
  const baseJob: Job = {
    job: {
      id: "job-1",
      source: "linkedin",
      title: "Senior Dev",
      company: "TechCorp",
      description: "We need devs",
      url: "https:/example.com",
      location: "Remote",
    },
    agent: {
      mode: "strict",
      state: "DECIDE",
      evaluation: {
        requirements: [
          { requirement: "TypeScript", confidence: 0.9, evidence: "5 years" },
          { requirement: "React", confidence: 0.8, evidence: "3 years" },
        ],
      },
      risks: {
        hardGaps: [],
        softGaps: [],
        mitigations: [],
      },
    },
  }

  describe("Rule D - forceProceed override", () => {
    it("should skip to PLAN when forceProceed is true", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          humanInput: {
            forceProceed: true,
          },
        },
      }
      const { nextState } = decideNextState(job)
      expect(nextState).toBe("PLAN")
    })

    it("should override hard gaps when forceProceed is true", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          risks: {
            hardGaps: ["Kubernetes", "Docker", "Rust"],
            softGaps: [],
            mitigations: [],
          },
          humanInput: {
            forceProceed: true,
          },
        },
      }
      const { nextState } = decideNextState(job)
      expect(nextState).toBe("PLAN")
    })
  })

  describe("Rule A - hard gaps logic", () => {
    it("should return FAILED when 3+ hard gaps and user declines", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          risks: {
            hardGaps: ["Kubernetes", "Docker", "Rust"],
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

    it("should return PLAN when 3+ hard gaps and user accepts", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          risks: {
            hardGaps: ["Kubernetes", "Docker", "Rust"],
            softGaps: [],
            mitigations: [],
          },
          humanInput: {
            answers: {
              HARD_GAPS_PROCEED: "yes",
            },
          },
        },
      }
      const { nextState } = decideNextState(job)
      expect(nextState).toBe("PLAN")
    })

    it("should ask for confirmation when 3+ hard gaps and unanswered", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          risks: {
            hardGaps: ["Kubernetes", "Docker", "Rust"],
            softGaps: [],
            mitigations: [],
          },
        },
      }
      const { nextState, questions } = decideNextState(job)
      expect(questions).toBeDefined()
      expect(questions?.some(q => q.id === "HARD_GAPS_PROCEED")).toBeTrue()
      expect(nextState).toBe("WAIT_FOR_HUMAN")
    })

    it("should proceed normally when < 3 hard gaps", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          risks: {
            hardGaps: ["Kubernetes"],
            softGaps: [],
            mitigations: [],
          },
        },
      }
      const { nextState, questions } = decideNextState(job)
      expect(nextState).not.toBe("FAILED")
      expect(questions?.some(q => q.id === "HARD_GAPS_PROCEED")).toBeFalsy()
    })
  })

  describe("Rule B - seniority/leadership mismatch", () => {
    it("should ask about leadership when needed", () => {
      const job: Job = {
        ...baseJob,
        job: {
          ...baseJob.job,
          senioritySignals: ["leadership"],
        },
        agent: {
          ...baseJob.agent!,
          risks: {
            hardGaps: ["ownership"],
            softGaps: [],
            mitigations: [],
          },
        },
      }
      const { questions } = decideNextState(job)
      expect(questions?.some(q => q.id === "LEADERSHIP_REFRAME")).toBeTrue()
    })

    it("should not ask about leadership when already answered", () => {
      const job: Job = {
        ...baseJob,
        job: {
          ...baseJob.job,
          senioritySignals: ["leadership"],
        },
        agent: {
          ...baseJob.agent!,
          risks: {
            hardGaps: ["ownership"],
            softGaps: [],
            mitigations: [],
          },
          humanInput: {
            answers: {
              LEADERSHIP_REFRAME: "stretch",
            },
          },
        },
      }
      const { questions } = decideNextState(job)
      expect(questions?.some(q => q.id === "LEADERSHIP_REFRAME")).toBeFalsy()
    })
  })

  describe("Rule C - low confidence strategy", () => {
    it("should ask when >40% low confidence requirements", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          evaluation: {
            requirements: [
              { requirement: "TypeScript", confidence: 0.9, evidence: "Yes" },
              { requirement: "React", confidence: 0.3, evidence: "Maybe" },
              { requirement: "Node.js", confidence: 0.2, evidence: "Maybe" },
              { requirement: "GraphQL", confidence: 0.1, evidence: "Maybe" },
              { requirement: "Docker", confidence: 0.9, evidence: "Yes" },
            ],
          },
        },
      }
      const { questions } = decideNextState(job)
      // 3 out of 5 = 60% low confidence
      expect(questions?.some(q => q.id === "LOW_CONFIDENCE_STRATEGY")).toBeTrue()
    })

    it("should not ask when confidence is high", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          evaluation: {
            requirements: [
              { requirement: "TypeScript", confidence: 0.9, evidence: "Yes" },
              { requirement: "React", confidence: 0.85, evidence: "Yes" },
              { requirement: "Node.js", confidence: 0.8, evidence: "Yes" },
            ],
          },
        },
      }
      const { questions } = decideNextState(job)
      expect(questions?.some(q => q.id === "LOW_CONFIDENCE_STRATEGY")).toBeFalsy()
    })
  })

  describe("Mode-based behavior", () => {
    it("should proceed with unanswered questions in exploratory mode", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          mode: "exploratory",
          risks: {
            hardGaps: ["Kubernetes", "Docker", "Rust"],
            softGaps: [],
            mitigations: [],
          },
          // No human input
        },
      }
      const { nextState } = decideNextState(job)
      expect(nextState).toBe("PLAN")
    })

    it("should wait for human in strict mode with unanswered questions", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          mode: "strict",
          risks: {
            hardGaps: ["Kubernetes", "Docker", "Rust"],
            softGaps: [],
            mitigations: [],
          },
          // No human input
        },
      }
      const { nextState } = decideNextState(job)
      expect(nextState).toBe("WAIT_FOR_HUMAN")
    })
  })

  describe("Error handling", () => {
    it("should throw error when agent is missing", () => {
      const job: Job = {
        ...baseJob,
        agent: undefined,
      }
      expect(() => decideNextState(job)).toThrow()
    })

    it("should return FAILED when evaluation is missing", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          evaluation: undefined,
        },
      }
      const { nextState } = decideNextState(job)
      expect(nextState).toBe("FAILED")
    })

    it("should return FAILED when risks is missing", () => {
      const job: Job = {
        ...baseJob,
        agent: {
          ...baseJob.agent!,
          risks: undefined,
        },
      }
      const { nextState } = decideNextState(job)
      expect(nextState).toBe("FAILED")
    })
  })
})

describe("runAgent", () => {
  const mockStore: AgentStore = {
    save: mock(async () => {}),
    load: mock(async () => null),
  }

  const baseJob: Job = {
    job: {
      id: "job-1",
      source: "linkedin",
      title: "Dev",
      company: "Corp",
      description: "Job description",
      url: "https://example.com",
      location: "Remote",
    },
    agent: {
      mode: "strict",
      state: "IDLE",
    },
  }

  it("should throw error when job.agent is missing", async () => {
    const job: Job = { ...baseJob, agent: undefined }
    expect(() => runSateMachine(job, mockStore)).toThrow()
  })

  it.skip("should transition through states: IDLE → INGEST → ...", async () => {
    const _job = { ...baseJob }
    // Note: This test is incomplete without mocking the handlers
    // Real test would need to mock handlers or provide full job context
  })

  it.skip("should save to declined when reaching FAILED", async () => {
    // Test would verify store.save is called with "declined" directory
  })

  it.skip("should save to approved when reaching DONE", async () => {
    // Test would verify store.save is called with "approved" directory
  })

  it.skip("should save to awaiting_input when reaching WAIT_FOR_HUMAN", async () => {
    // Test would verify store.save is called with "awaiting_input" directory
  })
})

describe("State handlers", () => {
  const baseJob: Job = {
    job: {
      id: "job-1",
      source: "linkedin",
      title: "Dev",
      company: "Corp",
      description: "Job description",
      url: "https://example.com",
      location: "Remote",
    },
    agent: {
      mode: "strict",
      state: "IDLE",
    },
  }

  describe("IDLE handler", () => {
    it("should transition to INGEST", async () => {
      const nextState = await handlers.IDLE(baseJob)
      expect(nextState).toBe("INGEST")
    })
  })

  describe("INGEST handler", () => {
    it("should transition to NORMALIZE when job data is complete", async () => {
      const job: Job = {
        ...baseJob,
        job: {
          ...baseJob.job,
          description: "Valid description",
        },
      }
      const nextState = await handlers.INGEST(job)
      expect(nextState).toBe("NORMALIZE")
    })

    it("should transition to FAILED when description is missing", async () => {
      const job: Job = {
        ...baseJob,
        job: {
          ...baseJob.job,
          description: "",
        },
      }
      const nextState = await handlers.INGEST(job)
      expect(nextState).toBe("FAILED")
    })
  })

  describe("WAIT_FOR_HUMAN handler", () => {
    it("should stay in WAIT_FOR_HUMAN state", async () => {
      const nextState = await handlers.WAIT_FOR_HUMAN(baseJob)
      expect(nextState).toBe("WAIT_FOR_HUMAN")
    })
  })

  describe("DONE and FAILED handlers", () => {
    it("DONE handler should reject", () => {
      expect(handlers.DONE(baseJob)).rejects.toThrowError()
    })

    it("FAILED handler should return FAILED", async () => {
      const nextState = await handlers.FAILED(baseJob)
      expect(nextState).toBe("FAILED")
    })
  })
})
