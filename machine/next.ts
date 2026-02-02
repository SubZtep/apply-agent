import type { AgentContext, AgentState } from ".."
import { logger } from "../lib/logger"

export function decideNextState(ctx: AgentContext): {
  nextState: AgentState
  questions?: string[]
} {
  const questions: string[] = []

  if (!ctx.evaluation || !ctx.risks) {
    return { nextState: "FAILED" }
  }

  // Rule D — human override
  if (ctx.humanInput?.forceProceed) {
    return { nextState: "PLAN" }
  }

  // Rule A — hard gaps
  if (ctx.risks.hardGaps.length >= 3) {
    questions.push("This role has multiple hard gaps. Do you want to proceed anyway?")
  }

  // Rule B — seniority mismatch
  if (ctx.job?.senioritySignals.includes("leadership") && ctx.risks.hardGaps.includes("ownership")) {
    questions.push(
      "This role expects leadership experience. Should I reframe your experience or treat this as a stretch role?",
    )
  }

  // Rule C — low confidence
  const lowConfidenceCount = ctx.evaluation.requirements.filter(r => r.confidence < 0.5).length
  const ratio = lowConfidenceCount / ctx.evaluation.requirements.length
  if (ratio > 0.4) {
    questions.push("Several matches are uncertain. Should I assume best-case or conservative interpretation?")
  }

  if (questions.length > 0) {
    switch (ctx.mode) {
      case "strict":
        return {
          nextState: "WAIT_FOR_HUMAN",
          questions,
        }
      case "exploratory":
        logger.info("Exploratory mode: proceeding despite uncertainty")
        return { nextState: "PLAN" }
    }
  }

  return { nextState: "PLAN" }
}
