import { type ActionPlan, ActionPlanSchema, type JobAgentContext } from "#/schemas/job"

const testData = {
  talkingPoints: [],
  prepTasks: [],
  cvTweaks: []
} as ActionPlan

export function generatePlan(_ctx?: JobAgentContext) {
  return Promise.resolve(ActionPlanSchema.parse(testData))
}
