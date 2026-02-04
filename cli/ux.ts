import type { AgentContext, AgentState } from "#/machine/types"

export function buildExecutionSummary(ctx: AgentContext, state: AgentState) {
  const summary: string[] = []

  if (state === "DONE") {
    summary.push("✅ Job accepted")
  }

  if (state === "FAILED") {
    summary.push("❌ Job rejected")
  }

  if (ctx.risks?.hardGaps.length) {
    summary.push(`• Hard gaps: ${ctx.risks.hardGaps.join(", ")}`)
  }

  if (ctx.risks?.softGaps.length) {
    summary.push(`• Soft gaps: ${ctx.risks.softGaps.join(", ")}`)
  }

  if (ctx.evaluation) {
    const low = ctx.evaluation.requirements.filter(r => r.confidence < 0.5).length
    summary.push(`• Low-confidence requirements: ${low}/${ctx.evaluation.requirements.length}`)
  }

  if (ctx.humanInput?.answers) {
    summary.push("• Human input influenced decision")
  }

  summary.push(`• Mode: ${ctx.mode}`)

  return summary
}
