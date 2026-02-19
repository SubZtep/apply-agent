// import type { ActionPlan, AgentQuestion, Evaluation, HumanInput, Job, RiskAssessment } from "#/schemas/job"

export type JobState = "approved" | "awaiting_input" | "declined" | "screened_out" | "shortlisted"

// // /** Questionnaire of the WAIT_FOR_HUMAN state. */
// // interface HumanInput {
// //   /** Step to PLAN state, no questions asked. */
// //   forceProceed?: boolean
// //   /** Questions and answers for DECIDE state. */
// //   answers?: Partial<Record<AgentQuestion["id"], string>>
// // }

// export interface AgentContext {
//   mode: "strict" | "exploratory"

//   // raw inputs
//   // jobText?: string;
//   // profileText?: result.dataresult.datastring;

//   // normalized data
//   // job?: JobSpec;

//   // evaluation results
//   evaluation?: Evaluation

//   // challenge phase output
//   risks?: RiskAssessment

//   questions?: AgentQuestion[]

//   // human decision
//   humanInput?: HumanInput

//   // final output
//   plan?: ActionPlan

//   // meta
//   errors?: string[]
// }

// // export interface PersistedAgent {
// //   id: string
// //   state: AgentState
// //   context: AgentContext
// //   updatedAt: number
// // }

// // export interface AgentStore {
// //   dir: string
// //   save(job: Job, dir?: JobState, oldDir?: JobState): Promise<void>
// //   load(id: string, dir: JobState): Promise<Job | null>
// // }
