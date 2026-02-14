import { describe, expect, it } from "bun:test"
import { JobSpecSchema } from "#/schemas/job"
import { RiskAssessmentSchema } from "#/schemas/risk"

describe("RiskAssessmentSchema", () => {
  it("should validate correct risk assessment", () => {
    const validRisk = {
      hardGaps: ["Kubernetes", "Docker"],
      softGaps: ["Leadership"],
      mitigations: ["Take online course", "Pair with senior dev"],
    }
    const result = RiskAssessmentSchema.safeParse(validRisk)
    expect(result.success).toBeTrue()
  })

  it("should accept empty gap arrays", () => {
    const invalidRisk = {
      hardGaps: [],
      softGaps: ["Leadership"],
      mitigations: ["Course"],
    }
    const result = RiskAssessmentSchema.safeParse(invalidRisk)
    expect(result.success).toBeTrue()
  })

  it("should reject more than 5 items in array", () => {
    const invalidRisk = {
      hardGaps: ["1", "2", "3", "4", "5", "6"],
      softGaps: [],
      mitigations: [],
    }
    const result = RiskAssessmentSchema.safeParse(invalidRisk)
    expect(result.success).toBeFalse()
  })

  it("should reject empty strings in arrays", () => {
    const invalidRisk = {
      hardGaps: [""],
      softGaps: [],
      mitigations: [],
    }
    const result = RiskAssessmentSchema.safeParse(invalidRisk)
    expect(result.success).toBeFalse()
  })
})

describe("JobSpecSchema", () => {
  it("should validate complete job spec", () => {
    const validSpec = {
      skills: ["TypeScript", "React"],
      responsibilities: ["Build UI", "Code review"],
      senioritySignals: ["5+ years", "Lead projects"],
    }
    const result = JobSpecSchema.safeParse(validSpec)
    expect(result.success).toBeTrue()
    expect(result.data?.skills).toEqual(["TypeScript", "React"])
  })

  it("should allow empty arrays", () => {
    const validSpec = {
      skills: [],
      responsibilities: [],
      senioritySignals: [],
    }
    const result = JobSpecSchema.safeParse(validSpec)
    expect(result.success).toBeTrue()
  })

  it("should reject non-string items", () => {
    const invalidSpec = {
      skills: ["TypeScript", 123],
      responsibilities: [],
      senioritySignals: [],
    }
    const result = JobSpecSchema.safeParse(invalidSpec)
    expect(result.success).toBeFalse()
  })

  it("should reject missing required fields", () => {
    const invalidSpec = {
      skills: ["TypeScript"],
      // missing responsibilities and senioritySignals
    }
    const result = JobSpecSchema.safeParse(invalidSpec)
    expect(result.success).toBeFalse()
  })
})
