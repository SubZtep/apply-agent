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
  for (const level of Object.keys(SENIORITY_LEVELS)) {
    if (text.includes(level)) return level
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
