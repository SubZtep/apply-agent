/** Clamp + round model score */
export function normalizeScore(score: number) {
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100))
}

/** Enforce penalties deterministically */
export function applyRedFlagPenalty(score: number, redFlags: string[]) {
  const penalty = redFlags.length * 0.1
  return Math.max(0, Math.round((score - penalty) * 100) / 100)
}
