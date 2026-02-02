import { z } from "zod";
// import type { AgentContext } from ".."

const testData = {
  talkingPoints: [],
  prepTasks: [],
  cvTweaks: [],
} as ActionPlan;

const ActionPlan = z.object({
  talkingPoints: z.array(z.string()),
  prepTasks: z.array(z.string()),
  cvTweaks: z.array(z.string()),
});

export type ActionPlan = z.infer<typeof ActionPlan>;

export function generatePlan(_ctx?: AgentContext) {
  return Promise.resolve(ActionPlan.parse(testData));
}
