import z from "zod"

export const ScoreSchema = z.object({
  score: z.number().min(0).max(1),
  signals: z.array(z.string().min(1)).min(1).max(5),
  redFlags: z.array(z.string()).max(3),
  breakdown: z.any().optional(),
  contributions: z.record(z.string(), z.number()).optional()
})

export const EvaluationSchema = z.object({
  requirements: z
    .array(
      z.object({
        requirement: z.string().min(1),
        confidence: z.number().min(0).max(1),
        evidence: z.string().min(1)
      })
    )
    .min(1)
})

export const RiskAssessmentSchema = z.object({
  hardGaps: z.array(z.string().min(1)).max(5),
  softGaps: z.array(z.string().min(1)).max(5),
  mitigations: z.array(z.string().min(1)).max(5)
})

const AgentStateSchema = z.enum([
  "IDLE",
  "INGEST",
  "NORMALIZE",
  "EVALUATE",
  "CHALLENGE",
  "DECIDE",
  "WAIT_FOR_HUMAN",
  "PLAN",
  "DONE",
  "FAILED"
])

const AgentQuestionSchema = z.object({
  id: z.enum(["HARD_GAPS_PROCEED", "LEADERSHIP_REFRAME", "LOW_CONFIDENCE_STRATEGY"]),
  text: z.string()
})

export const ActionPlanSchema = z.object({
  talkingPoints: z.array(z.string()),
  prepTasks: z.array(z.string()),
  cvTweaks: z.array(z.string())
})

export const JobAgentContextSchema = z.object({
  mode: z.enum(["strict", "exploratory"]),
  state: AgentStateSchema,
  evaluation: EvaluationSchema.optional(),
  risks: RiskAssessmentSchema.optional(),

  // human loop
  questions: AgentQuestionSchema.array().optional(),
  humanInput: z
    .object({
      answers: z
        .record(AgentQuestionSchema.shape.id, z.string())
        .optional()
        .describe("Questions and answers for DECIDE state."),
      forceProceed: z.boolean().optional().describe("Step to PLAN state, no questions asked.")
    })
    .optional()
    .describe("Questionnaire of the WAIT_FOR_HUMAN state."),

  // final output
  plan: ActionPlanSchema.optional(),

  // meta
  errors: z.string().array().optional()
})

export const JobSpecSchema = z.object({
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  senioritySignals: z.array(z.string())
})

export const JobDataSchema = z
  .object({
    source: z.string(),
    url: z.url(),
    title: z.string().min(1),
    description: z.string(),
    company: z.string(),
    location: z.string()
  })
  .describe("Values from the web scraper")

export const JobSchema = z.object({
  job: JobDataSchema.extend({
    id: z.string().min(1).describe("Calculated ID"),
    ...JobSpecSchema.partial().shape
  }),
  batch: ScoreSchema.optional(),
  agent: JobAgentContextSchema.optional()
})

export type Job = z.infer<typeof JobSchema>
export type JobData = z.infer<typeof JobDataSchema>
export type JobSpec = z.infer<typeof JobSpecSchema>
export type Score = z.infer<typeof ScoreSchema>
export type JobAgentContext = z.infer<typeof JobAgentContextSchema>
export type Evaluation = z.infer<typeof EvaluationSchema>
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>
export type AgentState = z.infer<typeof AgentStateSchema>
export type AgentQuestion = z.infer<typeof AgentQuestionSchema>
export type ActionPlan = z.infer<typeof ActionPlanSchema>
export type HumanInput = z.infer<
  typeof JobAgentContextSchema.shape.humanInput extends z.ZodOptional<infer U> ? U : never
>

export type JobState = "approved" | "awaiting_input" | "declined" | "screened_out" | "shortlisted"
export type JobDir = JobState | "inbox"
