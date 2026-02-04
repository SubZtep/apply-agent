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
  date_posted: string
  interval: string
  min_amount: string
  max_amount: string
  currency: string
  is_remote: string
  num_urgent_words: string
  benefits: string
  emails: string
  description: string
}
