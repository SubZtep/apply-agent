import z from "zod"

// FIXME: there are much more available fields
export const ScrapedJobSchema = z.object({
  job_url: z.url(),
  site: z.string(),
  title: z.string(),
  description: z.string(),
  company: z.string(),
  location: z.string()
})

export type ScrapedJob = z.infer<typeof ScrapedJobSchema>
