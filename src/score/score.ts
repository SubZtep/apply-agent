import { clamp, escapeRegex, toFixed } from "#/lib/utils"
import {
  DEFAULT_WEIGHTS,
  DOMAIN_MAP,
  NEGATIVE_PATTERNS,
  type ScoreWeights,
  SENIORITY_LEVELS,
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

  const requiredText = extractRequiredSection(jobTextLower)
  const requiredSkills = extractSkills(requiredText)

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
  const jobSeniority = detectSeniority(jobTextLower)
  const profileSeniority = detectSeniority(profileTextLower)
  const jobLevel = jobSeniority ? SENIORITY_LEVELS[jobSeniority] : null
  const profileLevel = profileSeniority ? SENIORITY_LEVELS[profileSeniority] : null
  const seniorityMatch = jobLevel !== null && profileLevel !== null && profileLevel >= jobLevel
  const seniorityMismatch = jobLevel !== null && (profileLevel === null || profileLevel < jobLevel)

  const requiredMatches = requiredSkills.filter(skill => filteredProfileSkills.includes(skill))
  const optionalSkills = jobSkills.filter(skill => !requiredSkills.includes(skill))
  const optionalMatches = optionalSkills.filter(skill => filteredProfileSkills.includes(skill))
  const requiredRatio = requiredSkills.length === 0 ? 1 : requiredMatches.length / requiredSkills.length
  const optionalRatio = optionalSkills.length === 0 ? 0 : optionalMatches.length / optionalSkills.length

  // Score
  const { score, contributions } = computeScore({
    requiredRatio,
    optionalRatio,
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
      requiredRatio,
      optionalRatio
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
  requiredRatio: number
  optionalRatio: number
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
  const requiredDelta = data.requiredRatio ** 1.5 * (w.skill * 0.7)
  const optionalDelta = data.optionalRatio ** 1.5 * (w.skill * 0.3)
  contributions.skills = toFixed(requiredDelta + optionalDelta)
  score += requiredDelta + optionalDelta

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

export function detectDomain(skills: string[]): string | null {
  if (!skills.length) return null

  const counts: Record<string, number> = {}

  for (const [domain, group] of Object.entries(DOMAIN_MAP)) {
    counts[domain] = skills.filter(skill => group.includes(skill)).length
  }

  let bestDomain: string | null = null
  let bestScore = 0

  for (const [domain, count] of Object.entries(counts)) {
    if (count > bestScore) {
      bestScore = count
      bestDomain = domain
    }
  }

  return bestScore > 0 ? bestDomain : null
}

function detectSeniority(text: string): string | null {
  const lower = text.toLowerCase()

  // Sort by length descending to avoid partial overlaps like "intern" inside "internal"
  const levels = Object.keys(SENIORITY_LEVELS).sort((a, b) => b.length - a.length)

  for (const level of levels) {
    const pattern = new RegExp(`\\b${escapeRegex(level)}\\b`, "i")
    if (pattern.test(lower)) return level
  }

  return null
}

function extractRequiredSection(text: string): string {
  const requiredPatterns = [
    /must\s+have[:\s]+([\s\S]*?)(?:\n\n|nice to have|required|$)/i,
    /required[:\s]+([\s\S]*?)(?:\n\n|nice to have|$)/i
  ]

  for (const pattern of requiredPatterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return match[1].toLowerCase()
    }
  }

  return ""
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
