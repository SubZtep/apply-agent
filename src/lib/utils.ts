/**
 * Limiting a value to a range between a minimum and a maximum value.
 * @param x the number value
 * @param minimum default: 0.0
 * @param maximum default: 1.0
 * @returns minimum >= clamped value <= maximum
 */
export function clamp(x: number, minimum = 0.0, maximum = 1.0) {
  return Math.max(minimum, Math.min(maximum, x))
}

/**
 * Normalize:
 * - Remove duplicates
 * - Lowercase items
 * - Trim items
 * @param arr string array
 * @returns normalized string array
 */
export function normalizeValues(arr: string[]) {
  return [...new Set(arr.map(s => s.toLowerCase().trim()))]
}
