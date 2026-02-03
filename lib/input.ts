import { type ParseArgsConfig, parseArgs } from "node:util"
// import type { AgentContext } from "..";
// import type { FileAgentStore, PersistedAgent } from "./persistence";

/** Ask human */
export async function getInitValues(store: AgentStore) {
  // let mode: AgentContext["mode"] | undefined;
  let agentId: string | undefined
  let persisted: PersistedAgent // | null = null;

  const args: ParseArgsConfig["options"] = {
    mode: {
      type: "string",
    },
    id: {
      type: "string",
    },
    "force-proceed": {
      type: "boolean",
    },
  }

  try {
    const { values } = parseArgs({ options: args })

    // if (values.mode) {
    //   // if (
    //   //   !["strict", "exploratory"].includes(values.mode as AgentContext["mode"])
    //   // )
    //   //   throw new Error("Invalid mode");
    //   mode = values.mode as AgentContext["mode"];
    // }

    if (values.id) {
      agentId = values.id as string
      // @ts-expect-error
      persisted = await store.load(agentId)

      if (!persisted) {
        throw new Error("Invalid id")
      }

      if (persisted.context.state !== "WAIT_FOR_HUMAN") {
        return persisted
      }

      if (values["force-proceed"]) {
        persisted.context.humanInput = {
          forceProceed: true,
        }
        persisted.context.state = "PLAN"
        return persisted
      }
    } else {
      return {
        // id: undefined,
        context: {
          mode: values.mode ?? "strict",
        },
      }
    }
  } catch (err: any) {
    console.error(err.message)
    console.log("Run with valid argument, e.g. for human input: bun run index.ts --id <uuid7>")
    console.table(args)
    process.exit(1)
  }

  // if (persisted?.context.humanInput) {
  // if (persisted.context.humanInput!.forceProceed) {
  //   persisted.context.state = "PLAN";
  // } else {
  const questions = persisted.context?.questions ?? []
  if (questions.length > 0) {
    console.log(
      `You need to answer ${questions.length} ${questions.length > 1 ? "s" : ""} for a role, ` +
        "or bypass with --force-proceed argument.\n" +
        "Please answer with as single world!",
    )

    persisted.context.humanInput = {}
    persisted.context.humanInput.answers = {}

    for (const { id, text } of questions) {
      persisted.context.humanInput.answers[id] = prompt(text) ?? ""
    }
  }

  await store.save(persisted)
  // }
  // }

  return persisted
  // return { agentId, context: persisted?.context };
}
