import { z } from "zod"
import type { AgentContext } from ".."

const mockResult: RiskAssessment = {
  hardGaps: ["ownership"],
  softGaps: [],
  interviewerPushbacks: [],
}

const RiskAssessment = z.object({
  hardGaps: z.array(z.string()),
  softGaps: z.array(z.string()),
  interviewerPushbacks: z.array(z.string()),
})

export type RiskAssessment = z.infer<typeof RiskAssessment>

export function challengeAssessment(_ctx?: AgentContext) {
  return Promise.resolve(RiskAssessment.parse(mockResult))
}
