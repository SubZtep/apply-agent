import { clamp, escapeRegex, toFixed } from "#/lib/utils"
import type { JobData } from "#/schemas/job"

// const _DEFAULT_WEIGHTS = {
//   strongMatch: 0.1,
//   missingSkill: 0.2,
//   domainMatch: 0.1,
//   domainMismatch: 0.2,
//   seniorityMatch: 0.1,
//   seniorityMismatch: 0.1,
//   base: 0.5
// }

export async function scoreSingleJob(
  job: Pick<JobData, "title" | "description">,
  profileText: string
  // weights: typeof DEFAULT_WEIGHTS
) {
  const jobTextLower = `${job.title}\n\n${job.description}`.trim().toLowerCase()
  const profileTextLower = profileText.trim().toLowerCase()

  // Extract skills
  const jobSkills = extractSkills(jobTextLower)
  const profileSkills = extractSkills(profileTextLower)

  // Detect negatives from profile
  const negativeMatches = getNegativeMatches(profileTextLower)

  // Remove negative skills from profileSkills
  const filteredProfileSkills = profileSkills.filter(skill => !negativeMatches.includes(skill))

  // Compute overlaps
  const strongMatches = jobSkills.filter(skill => filteredProfileSkills.includes(skill))
  const majorMissingSkills = jobSkills.filter(skill => !filteredProfileSkills.includes(skill))

  // Detect domain
  const jobDomain = detectDomain(jobSkills)
  const profileDomain = detectDomain(filteredProfileSkills)

  const domainMatch = jobDomain !== null && jobDomain === profileDomain
  const domainMismatch = jobDomain !== null && profileDomain !== null && jobDomain !== profileDomain

  // Seniority (very basic deterministic heuristic)
  const seniorityMatch = jobTextLower.includes("senior") && profileTextLower.includes("senior")
  const seniorityMismatch = jobTextLower.includes("senior") && !profileTextLower.includes("senior")

  // Score
  const { score, contributions } = computeScore({
    coverageRatio,
    strongMatches,
    majorMissingSkills,
    domainMatch,
    domainMismatch,
    seniorityMatch,
    seniorityMismatch
  })

  return {
    score,
    contributions,
    coverage: {
      matched: strongMatches,
      missing: majorMissingSkills,
      ratio: strongMatches.length / Math.max(jobSkills.length, 1)
    },
    meta: {
      domainMatch,
      domainMismatch,
      seniorityMatch,
      seniorityMismatch
    }
  }
}

function computeScore(data: {
  coverageRatio: number
  strongMatches: string[]
  majorMissingSkills: string[]
  domainMatch: boolean
  domainMismatch: boolean
  seniorityMatch: boolean
  seniorityMismatch: boolean
}) {
  const contributions = {
    base: 0.5,
    skills: 0,
    domainMatch: 0,
    seniorityMatch: 0,
    domainMismatch: 0,
    seniorityMismatch: 0
  }

  let score = contributions.base
  const skillDelta = data.coverageRatio * 0.5

  contributions.skills = toFixed(skillDelta)
  score += skillDelta

  // ---- Domain
  if (data.domainMatch) {
    contributions.domainMatch = 0.1
    score += 0.1
  }

  if (data.domainMismatch) {
    contributions.domainMismatch = -0.2
    score -= 0.2
  }

  // ---- Seniority
  if (data.seniorityMatch) {
    contributions.seniorityMatch = 0.1
    score += 0.1
  }

  if (data.seniorityMismatch) {
    contributions.seniorityMismatch = -0.1
    score -= 0.1
  }

  const finalScore = clamp(toFixed(score))

  return { score: finalScore, contributions }
}

const SKILL_ALIASES: Record<string, string[]> = {
  typescript: ["typescript", "ts"],
  javascript: ["javascript", "js"],
  aws: ["aws", "amazon web services"],
  react: ["react"],
  cobol: ["cobol"],
  python: ["python"],
  web: ["html", "css", "svelte", "vue"]
  // c: ["c"] // FIXME: use word boundaries: /\bc\b/
}

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    for (const alias of aliases) {
      const pattern = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i")
      if (pattern.test(lower)) {
        found.push(canonical)
        break
      }
    }
  }
  return [...new Set(found)]
}

const DOMAIN_MAP = {
  web: ["react", "javascript", "typescript"],
  cloud: ["aws"],
  systems: ["c", "cobol"]
}

export function detectDomain(skills: string[]): string | null {
  for (const [domain, group] of Object.entries(DOMAIN_MAP)) {
    if (skills.some(skill => group.includes(skill))) {
      return domain
    }
  }
  return null
}

const NEGATIVE_PATTERNS = [
  /(hate|dislike|avoid)\s+([a-z0-9/+#.\- ]+)/gi,
  /never\s+(?:want\s+to\s+)?(?:work\s+with\s+)?([a-z0-9/+#.\- ]+)/gi,
  /don't\s+want\s+to\s+(?:work\s+with\s+)?([a-z0-9/+#.\- ]+)/gi
]

function getNegativeMatches(textLower: string): string[] {
  const phrases: string[] = []
  for (const pattern of NEGATIVE_PATTERNS) {
    for (const match of textLower.matchAll(pattern)) {
      const phrase = match[match.length - 1]
      if (phrase) {
        phrases.push(phrase.toLowerCase().replace(/[.,]$/, "").trim())
      }
    }
  }
  return extractSkills(phrases.join(" "))
}
