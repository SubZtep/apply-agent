import type { AgentState } from "#/machine/types"
import type { Job } from "#/schemas/job"

export function buildExecutionSummary(job: Job, state: AgentState) {
  const summary: string[] = []

  if (state === "DONE") {
    summary.push("✅ Job accepted")
  }

  if (state === "FAILED") {
    summary.push("❌ Job rejected")
  }

  if (job.agent?.risks?.hardGaps.length) {
    summary.push(`• Hard gaps: ${job.agent.risks.hardGaps.join(", ")}`)
  }

  if (job.agent?.risks?.softGaps.length) {
    summary.push(`• Soft gaps: ${job.agent.risks.softGaps.join(", ")}`)
  }

  if (job.agent?.evaluation) {
    const low = job.agent.evaluation.requirements.filter(r => r.confidence < 0.5).length
    summary.push(`• Low-confidence requirements: ${low}/${job.agent.evaluation.requirements.length}`)
  }

  if (job.agent?.humanInput?.answers) {
    summary.push("• Human input influenced decision")
  }

  summary.push(`• Mode: ${job.agent?.mode}`)

  return summary
}
