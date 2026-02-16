import z from "zod"

export const ScrapedJobSchema = z.object({
  job_url: z.url(),
  site: z.string(),
  title: z.string(),
  description: z.string(),
  company: z.string(),
  location: z.string(),
  job_type: z.string().nullable(),
  date_posted: z.number().nullable(),
  interval: z.string().nullable(),
  min_amount: z.string().nullable(),
  max_amount: z.string().nullable(),
  currency: z.string().nullable(),
  is_remote: z.string().nullable(),
  num_urgent_words: z.number().nullable(),
  benefits: z.string().nullable(),
  emails: z.string().nullable()
})

export type ScrapedJob = z.infer<typeof ScrapedJobSchema>
