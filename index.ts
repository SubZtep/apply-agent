import { join } from "node:path"
import { file, randomUUIDv7 } from "bun"
import { getInitValues } from "./lib/input"
import { FileAgentStore } from "./lib/persistence"
import { runAgent } from "./machine/runner"

// import type { RiskAssessment } from "./states/challenge";
// import type { Evaluation } from "./states/evaluate";
// import type { JobSpec } from "./states/normalize";
// import type { ActionPlan } from "./states/plan";

// const store = new FileAgentStore();
// const { agentId, mode, state, ...inputContext } = await getInitValues(store);
// const { agentId, ...inputContext } = await getInitValues(store);
// const { id, context } = await getInitValues(store);
// console.log(initValues);
// process.exit();
// const persisted = await getInitValues(store)

await runAgent(
  persisted.id
    ? {
        agentId: persisted.id,
        initialContext: persisted.context,
        store,
      }
    : {
        agentId: randomUUIDv7(),
        initialContext: {
          mode: persisted.mode ?? "strict",
          state: "IDLE",
          // state: "IDLE",
          // ...inputContext,
          jobText: await file(join(import.meta.dirname, "data", "job.md")).text(),
          profileText: await file(join(import.meta.dirname, "data", "cv.md")).text(),
        },
        store,
      },
)
