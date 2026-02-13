import { join } from "node:path"
import Papa from "papaparse"
import { DATA_DIR } from "#/lib/store"
import type { Job } from "#/schemas/job"
import { scoreJobs } from "./score"
import type { ScrapedJob } from "./types"

// import { generateId } from "ai";

const profileText = await Bun.file(join(DATA_DIR, "cv.md")).text()

const JOBS_DIR = join(DATA_DIR, "jobs")
const csv = Bun.file(join(JOBS_DIR, "inbox", "jobs.csv"))
if (!(await csv.exists())) {
  throw new Error("Please scrape some jobs first.")
}

const { data: scrapedJobs } = Papa.parse<ScrapedJob>(await csv.text(), {
  header: true,
  skipEmptyLines: true,
})

const jobs = scrapedJobs.map(scoreJob => {
  const job: Job = {
    job: {
      id: calculateJobId(scoreJob),
      title: scoreJob.title,
      description: scoreJob.description,
      company: scoreJob.company,
      location: scoreJob.location,
      source: scoreJob.site,
      url: scoreJob.job_url,
      profileText,
    },
  }
  return job
})

await scoreJobs(jobs)

// return jobs;
// const res = await scoreJobs(jobs);
// console.log(jobs);

// const jobs: Job[] = {
//   job: {
//     id: calculateJobId(scoreJob),
//   },
// };

// const res = await scoreJobs(scrapedJobs, profileText);
// await scoreJobs(data).then(jobs

// console.log(jobs);

// complete: ({ data }) => {
//   logger.info({ count: data.length }, "Scraped jobs found");
//   data.forEach((job) => {
//     console.log("CCC", job.company);
//     // const id = calculateJobId({ job });
//     // jobs[id] = {
//     //   job: {
//     //     id,
//     //     source: job.site,
//     //     title: job.title,
//     //     company: job.company,
//     //     description: job.description,
//     //     url: job.job_url,
//     //     location: job.location,
//     //     profileText,
//     //   },
//     // };
//   });
// },
//});

// console.log("RES2", res2);
// process.exit(0);
// const res = await scoreJobs(Object.values(jobs), profileText);

// const res = await scoreJobs()

// for (const { id, ...batch } of res) {
//   const job = jobs[id];
//   if (!job) throw new Error(`Disappeared job: ${id}`);
//   const barchDir = isShortlisted(batch) ? "shortlisted" : "screened_out";
//   job.batch = batch;
//   await Bun.write(
//     join(JOBS_DIR, barchDir, `${id}.json`),
//     JSON.stringify(job, null, 2),
//   );
// }

// function isShortlisted(batch: { score: number }) {
//   // FIXME: proper check
//   return batch.score > 0.4;
// }

// function calculateJobId(title: string, company: string, url: string): string {
// function calculateJobId({ title, company, url }: Job["job"]): string {
//   const normalized =
//     `${title.trim()}|${company.trim()}|${url.trim()}`.toLowerCase();
//   return Bun.hash(normalized).toString(16);
// }

// function calculateJobId({ title, company, url }: Job["job"]) {

function calculateJobId({ title, company, job_url: url }: ScrapedJob) {
  const normalized = `${title.trim()}|${company.trim()}|${url.trim()}`.toLowerCase()
  return Bun.hash(normalized).toString(16)
}
