export interface BatchJob {
  id: string
  title: string
  description: string
  // source?: string
}

export interface JobScore {
  jobId: string
  score: number
  signals: string[]
  redFlags: string[]
}
