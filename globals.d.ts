type AgentState =
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

interface AgentQuestion {
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

interface AgentContext {
  /** Default is strict. */
  mode: "strict" | "exploratory";
  state: AgentState;

  // raw inputs
  jobText?: string;
  profileText?: string;

  // normalized data
  job?: JobSpec;

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

interface PersistedAgent {
  id: string;
  // state: AgentState
  context: AgentContext;
  // updatedAt: string;
}

interface AgentStore {
  save(agent: PersistedAgent): Promise<void>;
  load(id: string): Promise<PersistedAgent | null>;
}
