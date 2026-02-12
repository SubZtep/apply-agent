import type { JobScore } from "./types";

export function pickTopJobs(scores: JobScore[], minScore = 0.6, maxJobs = 5) {
  return scores
    .filter((s) => s.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.redFlags.length - b.redFlags.length; // tie-breaker
    })
    .slice(0, maxJobs);
}
