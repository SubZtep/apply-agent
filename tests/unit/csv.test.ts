import { describe, expect, it } from "bun:test"
import Papa from "papaparse"
import { calculateJobId, mapScrapedJobToJob } from "#/batch/lib"
import type { ScrapedJob } from "#/batch/types"

describe("CSV Parsing and Job Mapping", () => {
  describe("CSV Parsing", () => {
    it("should parse valid CSV with headers", () => {
      const csv = `title,company,description,location,site,job_url,job_type,date_posted,interval,min_amount,max_amount,currency,is_remote,num_urgent_words,benefits,emails
Senior Dev,TechCorp,Build backend systems,Remote,LinkedIn,https://example.com/job1,Full-time,2024-02-01,immediate,80000,120000,USD,true,2,Health Insurance,hr@techcorp.com`

      const { data } = Papa.parse<ScrapedJob>(csv, {
        header: true,
        skipEmptyLines: true,
      })

      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        title: "Senior Dev",
        company: "TechCorp",
        location: "Remote",
        site: "LinkedIn",
      })
    })

    it("should handle multiple job entries", () => {
      const csv = `title,company,description,location,site,job_url,job_type,date_posted,interval,min_amount,max_amount,currency,is_remote,num_urgent_words,benefits,emails
Senior Dev,TechCorp,Build backend,Remote,LinkedIn,https://example.com/job1,Full-time,2024-02-01,immediate,80000,120000,USD,true,2,Health,hr@tech.com
Frontend Dev,StartupXYZ,React work,NYC,Indeed,https://example.com/job2,Full-time,2024-02-02,immediate,70000,100000,USD,false,1,Stock,jobs@startup.com`

      const { data } = Papa.parse<ScrapedJob>(csv, {
        header: true,
        skipEmptyLines: true,
      })

      expect(data).toHaveLength(2)
      expect(data[0]?.title).toBe("Senior Dev")
      expect(data[1]?.title).toBe("Frontend Dev")
    })

    it("should skip empty lines", () => {
      const csv = `title,company,description,location,site,job_url,job_type,date_posted,interval,min_amount,max_amount,currency,is_remote,num_urgent_words,benefits,emails
Senior Dev,TechCorp,Build backend,Remote,LinkedIn,https://example.com/job1,Full-time,2024-02-01,immediate,80000,120000,USD,true,2,Health,hr@tech.com


Frontend Dev,StartupXYZ,React work,NYC,Indeed,https://example.com/job2,Full-time,2024-02-02,immediate,70000,100000,USD,false,1,Stock,jobs@startup.com`

      const { data } = Papa.parse<ScrapedJob>(csv, {
        header: true,
        skipEmptyLines: true,
      })

      expect(data).toHaveLength(2)
    })

    it("should handle quoted fields with commas", () => {
      const csv = `title,company,description,location,site,job_url,job_type,date_posted,interval,min_amount,max_amount,currency,is_remote,num_urgent_words,benefits,emails
"Senior Dev, Lead","Tech, Inc.","""Build backend, maintain systems""",Remote,LinkedIn,https://example.com/job1,Full-time,2024-02-01,immediate,80000,120000,USD,true,2,Health,hr@tech.com`

      const { data } = Papa.parse<ScrapedJob>(csv, {
        header: true,
        skipEmptyLines: true,
      })

      expect(data).toHaveLength(1)
      expect(data[0]?.title).toContain("Senior Dev")
      expect(data[0]?.company).toContain("Tech")
    })

    it("should preserve whitespace in description field", () => {
      const csv = `title,company,description,location,site,job_url,job_type,date_posted,interval,min_amount,max_amount,currency,is_remote,num_urgent_words,benefits,emails
Dev,Corp,"Line 1
Line 2
Line 3",Remote,LinkedIn,https://example.com/job1,Full-time,2024-02-01,immediate,80000,120000,USD,true,2,Health,hr@corp.com`

      const { data } = Papa.parse<ScrapedJob>(csv, {
        header: true,
        skipEmptyLines: true,
      })

      expect(data[0]?.description).toContain("Line 1")
      expect(data[0]?.description).toContain("Line 2")
    })
  })

  describe("Job ID Calculation", () => {
    it("should generate consistent ID for same job", () => {
      const scrapedJob: ScrapedJob = {
        title: "Senior Dev",
        company: "TechCorp",
        job_url: "https://example.com/job1",
        location: "Remote",
        description: "Build systems",
        site: "LinkedIn",
        job_type: "Full-time",
        date_posted: "2024-02-01",
        interval: "immediate",
        min_amount: "80000",
        max_amount: "120000",
        currency: "USD",
        is_remote: "true",
        num_urgent_words: "2",
        benefits: "Health",
        emails: "hr@tech.com",
      }

      const id1 = calculateJobId(scrapedJob)
      const id2 = calculateJobId(scrapedJob)

      expect(id1).toBe(id2)
    })

    it("should generate different IDs for different jobs", () => {
      const job1: ScrapedJob = {
        title: "Senior Dev",
        company: "TechCorp",
        job_url: "https://example.com/job1",
        location: "Remote",
        description: "Build systems",
        site: "LinkedIn",
        job_type: "Full-time",
        date_posted: "2024-02-01",
        interval: "immediate",
        min_amount: "80000",
        max_amount: "120000",
        currency: "USD",
        is_remote: "true",
        num_urgent_words: "2",
        benefits: "Health",
        emails: "hr@tech.com",
      }

      const job2: ScrapedJob = {
        ...job1,
        title: "Frontend Dev",
      }

      const id1 = calculateJobId(job1)
      const id2 = calculateJobId(job2)

      expect(id1).not.toBe(id2)
    })

    it("should normalize whitespace in ID calculation", () => {
      const job1: ScrapedJob = {
        title: "  Senior Dev  ",
        company: "  TechCorp  ",
        job_url: "  https://example.com/job1  ",
        location: "Remote",
        description: "Build systems",
        site: "LinkedIn",
        job_type: "Full-time",
        date_posted: "2024-02-01",
        interval: "immediate",
        min_amount: "80000",
        max_amount: "120000",
        currency: "USD",
        is_remote: "true",
        num_urgent_words: "2",
        benefits: "Health",
        emails: "hr@tech.com",
      }

      const job2: ScrapedJob = {
        ...job1,
        title: "Senior Dev",
        company: "TechCorp",
        job_url: "https://example.com/job1",
      }

      const id1 = calculateJobId(job1)
      const id2 = calculateJobId(job2)

      expect(id1).toBe(id2)
    })

    it("should be case-insensitive", () => {
      const job1: ScrapedJob = {
        title: "SENIOR DEV",
        company: "TECHCORP",
        job_url: "HTTPS://EXAMPLE.COM/JOB1",
        location: "Remote",
        description: "Build systems",
        site: "LinkedIn",
        job_type: "Full-time",
        date_posted: "2024-02-01",
        interval: "immediate",
        min_amount: "80000",
        max_amount: "120000",
        currency: "USD",
        is_remote: "true",
        num_urgent_words: "2",
        benefits: "Health",
        emails: "hr@tech.com",
      }

      const job2: ScrapedJob = {
        ...job1,
        title: "senior dev",
        company: "techcorp",
        job_url: "https://example.com/job1",
      }

      const id1 = calculateJobId(job1)
      const id2 = calculateJobId(job2)

      expect(id1).toBe(id2)
    })
  })

  describe("Job Mapping", () => {
    it("should map ScrapedJob to Job correctly", () => {
      const scrapedJob: ScrapedJob = {
        title: "Senior Dev",
        company: "TechCorp",
        job_url: "https://example.com/job1",
        description: "Build backend systems",
        location: "Remote",
        site: "LinkedIn",
        job_type: "Full-time",
        date_posted: "2024-02-01",
        interval: "immediate",
        min_amount: "80000",
        max_amount: "120000",
        currency: "USD",
        is_remote: "true",
        num_urgent_words: "2",
        benefits: "Health Insurance",
        emails: "hr@tech.com",
      }

      const job = mapScrapedJobToJob(scrapedJob)

      expect(job.job.title).toBe("Senior Dev")
      expect(job.job.company).toBe("TechCorp")
      expect(job.job.location).toBe("Remote")
      expect(job.job.description).toBe("Build backend systems")
      expect(job.job.source).toBe("LinkedIn")
      expect(job.job.url).toBe("https://example.com/job1")
      expect(job.job.id).toBeDefined()
    })

    it("should generate ID for mapped job", () => {
      const scrapedJob: ScrapedJob = {
        title: "Senior Dev",
        company: "TechCorp",
        job_url: "https://example.com/job1",
        description: "Build systems",
        location: "Remote",
        site: "LinkedIn",
        job_type: "Full-time",
        date_posted: "2024-02-01",
        interval: "immediate",
        min_amount: "80000",
        max_amount: "120000",
        currency: "USD",
        is_remote: "true",
        num_urgent_words: "2",
        benefits: "Health",
        emails: "hr@tech.com",
      }

      const job = mapScrapedJobToJob(scrapedJob)

      expect(job.job.id).toBeTruthy()
      expect(job.job.id.length).toBeGreaterThan(0)
    })

    it("should not copy ignored fields", () => {
      const scrapedJob: ScrapedJob = {
        title: "Senior Dev",
        company: "TechCorp",
        job_url: "https://example.com/job1",
        description: "Build systems",
        location: "Remote",
        site: "LinkedIn",
        job_type: "Full-time", // Not copied
        date_posted: "2024-02-01", // Not copied
        interval: "immediate", // Not copied
        min_amount: "80000", // Not copied
        max_amount: "120000", // Not copied
        currency: "USD", // Not copied
        is_remote: "true", // Not copied
        num_urgent_words: "2", // Not copied
        benefits: "Health", // Not copied
        emails: "hr@tech.com", // Not copied
      }

      const job = mapScrapedJobToJob(scrapedJob)

      // @ts-expect-error - checking that fields don't exist
      expect(job.job.job_type).toBeUndefined()
      // @ts-expect-error - checking that fields don't exist
      expect(job.job.date_posted).toBeUndefined()
    })

    it("should handle empty optional fields gracefully", () => {
      const scrapedJob: ScrapedJob = {
        title: "Dev",
        company: "Corp",
        job_url: "https://example.com/job1",
        description: "Build stuff",
        location: "",
        site: "LinkedIn",
        job_type: "",
        date_posted: "",
        interval: "",
        min_amount: "",
        max_amount: "",
        currency: "",
        is_remote: "",
        num_urgent_words: "",
        benefits: "",
        emails: "",
      }

      const job = mapScrapedJobToJob(scrapedJob)

      expect(job.job.location).toBe("")
      expect(job.job.title).toBe("Dev")
      expect(job.job.id).toBeDefined()
    })
  })

  describe("Full CSV Pipeline", () => {
    it("should process complete CSV workflow", () => {
      const csv = `title,company,description,location,site,job_url,job_type,date_posted,interval,min_amount,max_amount,currency,is_remote,num_urgent_words,benefits,emails
Senior Dev,TechCorp,Build backend,Remote,LinkedIn,https://example.com/job1,Full-time,2024-02-01,immediate,80000,120000,USD,true,2,Health,hr@tech.com
Frontend Dev,StartupXYZ,React work,NYC,Indeed,https://example.com/job2,Full-time,2024-02-02,immediate,70000,100000,USD,false,1,Stock,jobs@startup.com`

      const { data: scrapedJobs } = Papa.parse<ScrapedJob>(csv, {
        header: true,
        skipEmptyLines: true,
      })

      const jobs = scrapedJobs.map(mapScrapedJobToJob)

      expect(jobs).toHaveLength(2)
      expect(jobs[0]?.job.title).toBe("Senior Dev")
      expect(jobs[0]?.job.company).toBe("TechCorp")
      expect(jobs[0]?.job.id).toBeDefined()
      expect(jobs[1]?.job.title).toBe("Frontend Dev")
      expect(jobs[1]?.job.company).toBe("StartupXYZ")
      expect(jobs[1]?.job.id).toBeDefined()
      expect(jobs[0]?.job.id).not.toBe(jobs[1]?.job.id)
    })

    it("should handle CSV with special characters", () => {
      const csv = `title,company,description,location,site,job_url,job_type,date_posted,interval,min_amount,max_amount,currency,is_remote,num_urgent_words,benefits,emails
"Senior Dev & Architect","Tech-Corp, Inc.","Design systems with C++, Rust, & Python","New York, NY","LinkedIn","https://example.com/job1?tracking=123&param=value","Full-time","2024-02-01","immediate","80000","120000","USD","true","2","401k, Health & Dental","hr@tech-corp.com"`

      const { data } = Papa.parse<ScrapedJob>(csv, {
        header: true,
        skipEmptyLines: true,
      })

      expect(data).toHaveLength(1)
      expect(data[0]?.title).toContain("&")
      expect(data[0]?.company).toContain("-")
      expect(data[0]?.job_url).toContain("?")
    })
  })
})
