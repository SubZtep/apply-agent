import type { Evaluation } from "#/schemas/evalution";
import type { JobSpec } from "#/schemas/job";
import type { RiskAssessment } from "#/schemas/risk";
import type { ActionPlan } from "#/states/plan";

export type JobState =
  | "approved"
  | "awaiting_input"
  | "declined"
  | "screened_out"
  | "shortlisted";

export type AgentState =
  | "IDLE"
  | "INGEST"
  | "NORMALIZE"
  | "EVALUATE"
  | "CHALLENGE"
  | "DECIDE"
  | "WAIT_FOR_HUMAN"
  | "PLAN"
  | "DONE"
  | "FAILED";

export interface AgentQuestion {
  /** Policy hook */
  id: "HARD_GAPS_PROCEED" | "LEADERSHIP_REFRAME" | "LOW_CONFIDENCE_STRATEGY";
  text: string;
}

/** Questionnaire of the WAIT_FOR_HUMAN state. */
interface HumanInput {
  /** Step to PLAN state, no questions asked. */
  forceProceed?: boolean;
  /** Questions and answers for DECIDE state. */
  answers?: Partial<Record<AgentQuestion["id"], string>>;
}

export interface AgentContext {
  mode: "strict" | "exploratory";

  // raw inputs
  // jobText?: string;
  // profileText?: result.dataresult.datastring;

  // normalized data
  // job?: JobSpec;

  // evaluation results
  evaluation?: Evaluation;

  // challenge phase output
  risks?: RiskAssessment;

  questions?: AgentQuestion[];

  // human decision
  humanInput?: HumanInput;

  // final output
  plan?: ActionPlan;

  // meta
  errors?: string[];
}

export interface PersistedAgent {
  id: string;
  state: AgentState;
  context: AgentContext;
  updatedAt: number;
}

export interface AgentStore {
  save(
    agent: Omit<PersistedAgent, "updatedAt"> & { updatedAt?: number },
  ): Promise<PersistedAgent>;
  load(id: string): Promise<PersistedAgent | null>;
}
