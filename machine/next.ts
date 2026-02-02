import type { AgentContext, AgentState } from ".."

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
  if (ctx.evaluation.requirements.length > 0) {
    const lowConfidenceCount = ctx.evaluation.requirements.filter(r => r.confidence === "low").length
    const ratio = lowConfidenceCount / ctx.evaluation.requirements.length
    if (ratio > 0.4) {
      questions.push("Several matches are uncertain. Should I assume best-case or conservative interpretation?")
    }
  }

  if (questions.length > 0) {
    return {
      nextState: "WAIT_FOR_HUMAN",
      questions,
    }
  }

  return { nextState: "PLAN" }
}
