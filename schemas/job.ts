import z from "zod"

export const JobSpecSchema = z.object({
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  senioritySignals: z.array(z.string()),
})

export type JobSpec = z.infer<typeof JobSpecSchema>
