export const SENRITY_PHRASES = ["senior", "principal", "staff", "lead", "architect", "head", "vp", "intern", "junior"]

export const DEFAULT_WEIGHTS = {
  // base: 0.4,
  // skill: 0.4,
  // domainMatch: 0.1,
  // domainMismatch: -0.2,
  // seniorityMatch: 0.1,
  // seniorityMismatch: -0.1
  base: 0.2,
  skill: 0.5,
  domainMatch: 0.15,
  domainMismatch: -0.25,
  seniorityMatch: 0.1,
  seniorityMismatch: -0.2
}

export type ScoreWeights = typeof DEFAULT_WEIGHTS

export const SKILL_ALIASES: Record<string, string[]> = {
  typescript: ["typescript", "ts"],
  javascript: ["javascript", "js", "ecmascript"],
  aws: ["aws", "amazon web services"],
  devops: ["lambda", "serverless", "cloud", "docker", "linux"],
  react: ["react", "reactjs", "svelte", "vue", "reactjs"],
  cobol: ["cobol"],
  data: ["mysql", "postgresql", "mongo", "mongodb", "redis", "elasticsearch"],
  software: ["python", "py", "go", "golang", "rust", "java", ".net"],
  web: ["html", "xhtml", "html5", "css", "scss", "sass", "tailwind", "tailwindcss", "ux"]
  // c: ["c"] // FIXME: use word boundaries: /\bc\b/
}

export const DOMAIN_MAP = {
  web: ["react", "javascript", "typescript"],
  cloud: ["aws"],
  systems: ["c", "cobol"]
}

export const NEGATIVE_PATTERNS = [
  /(hate|dislike|avoid)\s+([a-z0-9/+#.\- ]+)/gi,
  /never\s+(?:want\s+to\s+)?(?:work\s+with\s+)?([a-z0-9/+#.\- ]+)/gi,
  /don't\s+want\s+to\s+(?:work\s+with\s+)?([a-z0-9/+#.\- ]+)/gi
]
