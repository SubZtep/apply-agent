import { logger } from "#/lib/logger"
import type { AgentContext, AgentQuestion, AgentState } from "./types"

export function decideNextState(ctx: AgentContext): {
  nextState: AgentState
  questions?: AgentQuestion[]
} {
  const questions: AgentQuestion[] = []

  if (!ctx.evaluation || !ctx.risks) {
    return { nextState: "FAILED" }
  }

  const human = interpretHumanAnswers(ctx)

  // Rule D — human override
  if (ctx.humanInput?.forceProceed) {
    return { nextState: "PLAN" }
  }

  // Rule A — hard gaps
  if (ctx.risks.hardGaps.length >= 3 && !human.proceedDespiteHardGaps) {
    questions.push({
      id: "HARD_GAPS_PROCEED",
      text: "This role has multiple hard gaps. Do you want to proceed anyway?",
    })
  }

  // Rule B — seniority mismatch
  if (
    ctx.job?.senioritySignals.includes("leadership") &&
    ctx.risks.hardGaps.includes("ownership") &&
    !human.leadershipMode
  ) {
    questions.push({
      id: "LEADERSHIP_REFRAME",
      text: "This role expects leadership experience. Should I reframe your experience or treat this as a stretch role?",
    })
  }

  // Rule C — low confidence
  const lowConfidenceCount = ctx.evaluation.requirements.filter(r => r.confidence < 0.5).length
  const ratio = lowConfidenceCount / ctx.evaluation.requirements.length
  if (ratio > 0.4 && !human.confidenceStrategy) {
    questions.push({
      id: "LOW_CONFIDENCE_STRATEGY",
      text: "Several matches are uncertain. Should I assume best-case or conservative interpretation?",
    })
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

export function interpretHumanAnswers(ctx: AgentContext) {
  const answers = ctx.humanInput?.answers ?? {}
  return {
    proceedDespiteHardGaps: answers.HARD_GAPS_PROCEED === "yes",
    confidenceStrategy: answers.LOW_CONFIDENCE_STRATEGY ?? "conservative",
    leadershipMode: answers.LEADERSHIP_REFRAME ?? "strict",
  }
}
