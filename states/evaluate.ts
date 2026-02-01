import { z } from "zod"
import type { JobSpec } from "./normalize"

const testData: EvaluationResult = { requirements: [] }

const RequirementEvaluation = z.array(
  z.object({
    requirement: z.string(),
    match: z.enum(["strong", "partial", "none"]),
    evidence: z.string().optional(),
    confidence: z.enum(["low", "medium", "high"]),
  }),
)

const EvaluationResult = z.object({
  requirements: RequirementEvaluation,
})

export type EvaluationResult = z.infer<typeof EvaluationResult>

export function evaluateMatch(_jobSpec: JobSpec, _profileText: string) {
  return Promise.resolve(EvaluationResult.parse(testData))
}
