import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";
import { file, write } from "bun";
// import type { AgentContext, AgentState } from ".."
import { logger } from "./logger";

const STORE_DIR = join(import.meta.dirname, "..", "data", "agent")

export async save(id: string, agent: AgentContext) {
  await mkdir(STORE_DIR, { recursive: true });
  await write(
    join(STORE_DIR, `${id}.json`),
    JSON.stringify(
      agent,
      null,
      2,
    )
  );
}

export async load(id: string) {
  try {
    return (await file(
      join(STORE_DIR, `${id}.json`),
    ).json())
  } catch {
    return null;
  }
}





export class FileAgentStore implements AgentStore {
  async save(agent: Omit<PersistedAgent, "updatedAt">) {
    await mkdir(STORE_DIR, { recursive: true });
    await write(
      join(STORE_DIR, `${agent.id}.json`),
      JSON.stringify(
        { ...agent, updatedAt: new Date().toISOString() } as PersistedAgent,
        null,
        2,
      ),
    );
  }

  async load(id: string) {
    try {
      return (await file(
        join(STORE_DIR, `${id}.json`),
      ).json()) as PersistedAgent;
    } catch {
      return null;
    }
  }
}
