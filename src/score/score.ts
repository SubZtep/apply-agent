import { tokenToString } from "typescript"
import { ollama } from "#/lib/ai"
import { applyRedFlagPenalty, normalizeScore } from "#/lib/job"
import { logger } from "#/lib/logger"
import { appearsInBoth, clamp, normalizeValues } from "#/lib/utils"
import { type Job, type JobData, type Score, ScoreSchema } from "#/schemas/job"
import { type ScoringJobOutput, ScoringJobOutputSchema } from "#/schemas/structured"

const _prompts = {
  system: () => `
You are a job scoring function.

You must return structured output only.
Do not explain your answer.
Do not add extra keys.

Scoring rules (STRICT):

Start from a base score of 0.5.

Identify:
- required skills
- seniority expectations
- domain signals
- red flags

Then apply ALL applicable adjustments cumulatively:

Skills:
+0.2 strong skill overlap
+0.1 partial skill overlap
-0.2 major missing required skill

Seniority:
+0.1 seniority match
-0.1 seniority mismatch

Domain:
+0.1 domain match
-0.1 domain mismatch

Penalties:
For EACH red flag, subtract 0.1.

Clamp final score to range 0.0–1.0.
Round to at most 2 decimal places.

The final score MUST reflect penalties.
DO NOT ignore red flags.
DO NOT output percentages.
DO NOT use excessive precision.

The average job should score around 0.4.

Signals must be concrete evidence, not rubric labels.
Examples: "typescript", "backend APIs", "fintech domain"
Invalid: "skill overlap", "good fit"
`,
  prompt: (job: Job, profileText: string) => `
  PROFILE (summary):
  ${profileText}

  JOB:
  Title: ${job.job.title}

  Description:
  ${job.job.description}

  Evaluate fit using ONLY:
  - skill overlap
  - seniority match
  - domain relevance
  `
}

// const SYSTEM_PROMPT = `
// You are a job scorer.

// You **must**
// - return VALID JSON ONLY
// - match this exact schema: { score, signals, redFlags }

// JSON RULES
// - score must be a number 0.00–1.00
// - round score to at most 2 decimals
// - signals must be concrete tokens (no opinion text)
// - redFlags must be short tokens
// - do NOT return prose
// - do NOT output keys that are not in the schema

// SCORING RULES
// 1. Start from 0.50 base.
// 2. Add:
//    +0.2 strong skill overlap
//    +0.1 partial skill overlap
//    +0.1 domain match
//    +0.1 seniority match
// 3. Subtract:
//    -0.2 major missing required skill
//    -0.1 domain mismatch
//    -0.1 seniority mismatch
// 4. For each red flag, subtract 0.1 each.
// 5. Final score = clamp(score, 0.0, 1.0)

// Example valid JSON:
// {"score":0.72,"signals":["typescript","backend"],"redFlags":["aws-heavy"]}

// Do NOT add extra keys.
// `

type ScoringPromptJobData = Pick<JobData, "title" | "description">

const SYSTEM_PROMPT = `
You are a deterministic job evaluator.

Return JSON only.

Definitions:

strongMatches:
- technologies or skills explicitly mentioned in both job and profile
- exact overlap only (e.g. "TypeScript", "AWS")

partialMatches:
- related but not exact overlap (e.g. "web development" vs "React")

majorMissingSkills:
- required technologies mentioned in job but absent in profile

domainMatch:
true if job domain (web/backend/cloud/systems) aligns with profile experience.

seniorityMatch:
true if job seniority aligns with profile seniority.

Rules:
- Do NOT invent abstract skills.
- Do NOT output categories like "Full-stack skills".
- Only use concrete words found in job or profile.
- If unsure, leave array empty.
- Be conservative.
`

function buildScoringPrompt(job: ScoringPromptJobData, profileText: string) {
  return `
PROFILE_SUMMARY:
${profileText}

JOB_TITLE: ${job.title}
JOB_DESCRIPTION:
${job.description}

Return JSON according to system rules.
`
}

export async function scoreSingleJob(job: ScoringPromptJobData, profileText: string): Promise<Score> {
  const userPrompt = buildScoringPrompt(job, profileText)

  const result = await ollama.chat({
    model: process.env.BATCH_MODEL,
    format: ScoringJobOutputSchema.toJSONSchema(),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ]
  })

  let content: ScoringJobOutput | undefined
  try {
    content = JSON.parse(result.message.content)
  } catch (error) {
    logger.error({ error, result }, "Parse job scoring result failed")
  }

  if (!content) {
    return {
      score: 0.0,
      signals: [],
      redFlags: ["message_parse_error"]
    }
  }

  const parsed = ScoringJobOutputSchema.safeParse(content)
  if (!parsed.success) {
    logger.error({ error: parsed.error, result }, "Parse job scoring result failed")
    return {
      score: 0.0,
      signals: [],
      redFlags: ["schema_parse_error"]
    }
  }

  parsed.data.strongMatches = normalizeValues(parsed.data.strongMatches)
  parsed.data.strongMatches = extractSkills(parsed.data.strongMatches.join(" "))
  parsed.data.partialMatches = normalizeValues(parsed.data.partialMatches)
  parsed.data.partialMatches = extractSkills(parsed.data.partialMatches.join(" "))

  const jobTextLower = `${job.title}\n\n${job.description}`.trim().toLowerCase()
  const profileTextLower = profileText.trim().toLowerCase()
  const negativeMatches = getNegativeMatches(profileTextLower)

  negativeMatches
    .filter(negative => parsed.data.strongMatches.includes(negative))
    .forEach(match => {
      parsed.data.strongMatches = parsed.data.strongMatches.filter(word => word !== match)
      parsed.data.majorMissingSkills.push(match)
    })

  negativeMatches
    .filter(negative => parsed.data.partialMatches.includes(negative))
    .forEach(match => {
      parsed.data.partialMatches = parsed.data.partialMatches.filter(word => word !== match)
      if (!parsed.data.majorMissingSkills.includes(match)) parsed.data.majorMissingSkills.push(match)
    })

  const appearsInBothFilter = (token: string) => jobTextLower.includes(token) && profileTextLower.includes(token)
  parsed.data.strongMatches = parsed.data.strongMatches.filter(appearsInBothFilter)
  parsed.data.partialMatches = parsed.data.partialMatches.filter(appearsInBothFilter)

  return {
    score: computeScore(parsed.data),
    signals: [...parsed.data.strongMatches, ...parsed.data.partialMatches],
    redFlags: parsed.data.majorMissingSkills
  }
}

function computeScore(data: ScoringJobOutput) {
  let score = 0.5
  score += Math.min(0.4, data.strongMatches.length * 0.1)
  score += Math.min(0.2, data.partialMatches.length * 0.05)
  if (data.domainMatch) score += 0.1
  if (data.seniorityMatch) score += 0.1
  if (data.majorMissingSkills.length > 0) score -= 0.3
  if (data.domainMismatch) score -= 0.2
  if (data.seniorityMismatch) score -= 0.1
  return clamp(Number(score.toFixed(3)))
}

const SKILL_ALIASES: Record<string, string[]> = {
  typescript: ["typescript", "ts"],
  javascript: ["javascript", "js"],
  aws: ["aws", "amazon web services"],
  react: ["react"],
  cobol: ["cobol"],
  python: ["python"]
  // c: ["c"] // FIXME: use word boundaries: /\bc\b/
}

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []

  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    if (aliases.some(alias => lower.includes(alias))) {
      found.push(canonical)
    }
  }

  return found
}

function getNegativeMatches(textLower: string): string[] {
  const NEGATIVE_PATTERNS = [
    /(hate|dislike|avoid)\s+([a-z0-9/+#.\- ]+)/gi,
    /never\s+(?:want\s+to\s+)?(?:work\s+with\s+)?([a-z0-9/+#.\- ]+)/gi,
    /don't\s+want\s+to\s+(?:work\s+with\s+)?([a-z0-9/+#.\- ]+)/gi
  ]

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

// After you tighten the prompt and schema, add a quick histogram logger:
// logger.info({
//   distribution: {
//     "<0.3": scores.filter(s => s.score < 0.3).length,
//     "0.3-0.6": scores.filter(s => s.score >= 0.3 && s.score < 0.6).length,
//     "0.6-0.8": scores.filter(s => s.score >= 0.6 && s.score < 0.8).length,
//     ">0.8": scores.filter(s => s.score >= 0.8).length
//   }
// }, "batch score distribution")
// It’s extremely useful to check whether the model is actually discriminating — otherwise you won’t know if the logic is doing anything.
