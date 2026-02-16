import z from "zod"

// export const ScrapedJobSchema = z.object({
//   job_url: z.string().url(),
//   site: z.string(),
//   title: z.string(),
//   company: z.string(),
//   location: z.string(),
//   job_type: z.string().nullable(),
//   date_posted: z.number(),
//   interval: z.string().nullable(),
//   min_amount: z.string().nullable(),
//   max_amount: z.string().nullable(),
//   currency: z.string().nullable(),
//   is_remote: z.string().nullable(),
//   num_urgent_words: z.number().nullable(),
//   benefits: z.string().nullable(),
//   emails: z.string().nullable(),
//   description: z.string().nullable()
// })

// export type ScrapedJobZod = z.infer<typeof ScrapedJobSchema>

export const BatchScoreSchema = z.object({
  score: z.number().min(0).max(1),
  signals: z.array(z.string().min(1)).min(1).max(5),
  redFlags: z.array(z.string()).max(3)
})

export type BatchScore = z.infer<typeof BatchScoreSchema>
