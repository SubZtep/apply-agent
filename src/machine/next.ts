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

  // Rule D — human override
  if (ctx.humanInput?.forceProceed) {
    return { nextState: "PLAN" }
  }

  const human = interpretHumanAnswers(ctx)

  // Rule A — hard gaps: answered NO → FAIL
  if (ctx.risks.hardGaps.length >= 3 && human.hasAnsweredHardGaps && !human.proceedDespiteHardGaps) {
    logger.info("User declined proceeding due to hard gaps")
    return { nextState: "FAILED" }
  }

  // Rule A — hard gaps: unanswered → ask
  if (ctx.risks.hardGaps.length >= 3 && !human.hasAnsweredHardGaps) {
    questions.push({
      id: "HARD_GAPS_PROCEED",
      text: "This role has multiple hard gaps. Do you want to proceed anyway?",
    })
  }

  // Rule B — seniority mismatch
  if (
    ctx.job?.senioritySignals.includes("leadership") &&
    ctx.risks.hardGaps.includes("ownership") &&
    !human.hasAnsweredLeadership
  ) {
    questions.push({
      id: "LEADERSHIP_REFRAME",
      text: "This role expects leadership experience. Should I reframe your experience or treat this as a stretch role?",
    })
  }

  // Rule C — low confidence
  const lowConfidenceCount = ctx.evaluation.requirements.filter(r => r.confidence < 0.5).length
  const ratio = lowConfidenceCount / ctx.evaluation.requirements.length
  if (ratio > 0.4 && !human.hasAnsweredConfidence) {
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

function interpretHumanAnswers(ctx: AgentContext) {
  const raw = ctx.humanInput?.answers ?? {}

  const hasHardGapsKey = Object.hasOwn(raw, "HARD_GAPS_PROCEED")
  const hasConfidenceKey = Object.hasOwn(raw, "LOW_CONFIDENCE_STRATEGY")
  const hasLeadershipKey = Object.hasOwn(raw, "LEADERSHIP_REFRAME")

  const hardGaps = normalizeAnswer(raw.HARD_GAPS_PROCEED)
  const confidence = normalizeAnswer(raw.LOW_CONFIDENCE_STRATEGY)
  const leadership = normalizeAnswer(raw.LEADERSHIP_REFRAME)

  const result = {
    proceedDespiteHardGaps: hardGaps === "yes",

    hasAnsweredHardGaps: hasHardGapsKey,
    hasAnsweredConfidence: hasConfidenceKey,
    hasAnsweredLeadership: hasLeadershipKey,

    confidenceStrategy: confidence ?? "conservative",
    leadershipMode: leadership ?? "strict",
  }

  logger.info({ raw, result }, "Human answers interpreted")
  return result
}

function normalizeAnswer(value?: string): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim().toLowerCase()
  return trimmed === "" ? undefined : trimmed
}
