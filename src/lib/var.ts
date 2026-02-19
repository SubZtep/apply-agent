import { join } from "node:path"

export function jobDir(dir?: "inbox" | "screened_out" | "shortlisted" | "awaiting_input" | "declined" | "approved") {
  if (!dir) {
    return process.env.JOBS_DIR
  }
  return join(process.env.JOBS_DIR, dir)
}
