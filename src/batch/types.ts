export interface JobScore {
  jobId: string
  score: number
  signals: string[]
  redFlags: string[]
}

export interface ScrapedJob {
  job_url: string
  site: string
  title: string
  company: string
  location: string
  job_type: string
  date_posted: number
  interval: string | null
  min_amount: string | null
  max_amount: string | null
  currency: string | null
  is_remote: string | null
  num_urgent_words: number
  benefits: string | null
  emails: string | null
  description: string
}
