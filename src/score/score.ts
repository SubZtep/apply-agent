import { clamp, escapeRegex, toFixed } from "#/lib/utils"
import {
  DEFAULT_WEIGHTS,
  DOMAIN_MAP,
  NEGATIVE_PATTERNS,
  type ScoreWeights,
  SENRITY_PHRASES,
  SKILL_ALIASES
} from "#/lib/vars"
import type { JobData } from "#/schemas/job"

export async function scoreSingleJob(
  job: Pick<JobData, "title" | "description">,
  profileText: string,
  weights = DEFAULT_WEIGHTS
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

  // Seniority
  let seniorityMatch = false
  let seniorityMismatch = false
  for (const phrase in SENRITY_PHRASES) {
    if (jobTextLower.includes(phrase) && profileTextLower.includes(phrase)) seniorityMatch = true
    if (jobTextLower.includes(phrase) && !profileTextLower.includes(phrase)) seniorityMismatch = true
    if (seniorityMatch && seniorityMismatch) break
  }

  const totalSkills = jobSkills.length
  const coverageRatio = totalSkills === 0 ? 0 : strongMatches.length / totalSkills

  // Score
  const { score, contributions } = computeScore({
    coverageRatio,
    domainMatch,
    domainMismatch,
    seniorityMatch,
    seniorityMismatch,
    weights
  })

  return {
    score,
    contributions,
    coverage: {
      matched: strongMatches,
      missing: majorMissingSkills,
      ratio: coverageRatio
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
  domainMatch: boolean
  domainMismatch: boolean
  seniorityMatch: boolean
  seniorityMismatch: boolean
  weights: ScoreWeights
}) {
  const w = data.weights

  const contributions = {
    base: w.base,
    skills: 0,
    domainMatch: 0,
    domainMismatch: 0,
    seniorityMatch: 0,
    seniorityMismatch: 0
  }

  let score = w.base

  // ---- Skills
  const skillDelta = data.coverageRatio ** 1.5 * w.skill
  contributions.skills = toFixed(skillDelta)
  score += skillDelta

  // ---- Domain
  if (data.domainMatch) {
    contributions.domainMatch = w.domainMatch
    score += w.domainMatch
  }

  if (data.domainMismatch) {
    contributions.domainMismatch = w.domainMismatch
    score += w.domainMismatch
  }

  // ---- Seniority
  if (data.seniorityMatch) {
    contributions.seniorityMatch = w.seniorityMatch
    score += w.seniorityMatch
  }

  if (data.seniorityMismatch) {
    contributions.seniorityMismatch = w.seniorityMismatch
    score += w.seniorityMismatch
  }

  const finalScore = clamp(toFixed(score))

  return { score: finalScore, contributions }
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

// FIXME: Domain Detection Is Too Naive
// - First match wins
// - No scoring
// - No dominance logic
export function detectDomain(skills: string[]): string | null {
  for (const [domain, group] of Object.entries(DOMAIN_MAP)) {
    if (skills.some(skill => group.includes(skill))) {
      return domain
    }
  }
  return null
}

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
