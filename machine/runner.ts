import { buildExecutionSummary } from "#/cli/ux";
import type { Job } from "#/schemas/job";
import { handlers } from "./handlers";
import type { AgentState, AgentStore, PersistedAgent } from "./types";

// export async function runAgent(persisted: PersistedAgent, store: AgentStore) {
export async function runAgent(job: Job, store: AgentStore) {
  while (true) {
    const next = await handlers[job.agent!.state](job);
    job.agent!.state = next;
    console.log(`\n→ ${job.agent!.state}`);
    // await store.save(job.job);

    if (terminal(next)) {
      const summary = buildExecutionSummary(job.agent, next);
      console.log("\n=== Execution Summary ===");
      summary.forEach((line) => void console.log(line));
      return;
    }
  }
}

function terminal(state: AgentState) {
  switch (state) {
    case "DONE":
      console.log("✅ Agent completed successfully");
      break;
    case "FAILED":
      console.log("❌ Agent failed");
      break;
    case "WAIT_FOR_HUMAN":
      console.log("⏸ Agent is waiting for human input");
      break;
  }
  return ["DONE", "FAILED", "WAIT_FOR_HUMAN"].includes(state);
}
