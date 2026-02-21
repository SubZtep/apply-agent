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

/**
 * Escapes special regular expression characters in a string so it can be safely
 * used as a literal pattern within a RegExp.
 *
 * This prevents "Regex Injection" attacks where user input containing regex
 * metacharacters (like `.*`) would match unintended content. The function escapes
 * all characters that have special meaning in regular expressions, including
 * the hyphen (`-`) to prevent accidental character range creation when the
 * result is used inside character classes `[...]`.
 *
 * @param str - The string to escape. If empty, returns empty string.
 * @returns The escaped string with all regex metacharacters prefixed by backslashes.
 *
 * @example
 * ```ts
 * const userInput = "C++";
 * const safePattern = escapeRegex(userInput);
 * // => "C\\+\\+"
 * new RegExp(safePattern).test("C++"); // true
 * new RegExp(safePattern).test("C");   // false
 * ```
 *
 * @example
 * ```ts
 * const malicious = ".*";
 * const safe = escapeRegex(malicious);
 * // => "\\.\\*"
 * new RegExp(`^${safe}$`).test(".*");        // true
 * new RegExp(`^${safe}$`).test("anything"); // false
 * ```
 *
 * @example
 * ```ts
 * const range = "A-Z";
 * const safe = escapeRegex(range);
 * // => "A\\-Z"
 * new RegExp(`[${safe}]`).test("A"); // true
 * new RegExp(`[${safe}]`).test("B"); // false
 * ```
 *
 * @example
 * ```ts
 * escapeRegex("(555) 123-4567");      // "\\(555\\) 123\\-4567"
 * escapeRegex("C:\\Windows\\System32"); // "C:\\\\Windows\\\\System32"
 * escapeRegex("Price: $5.00");        // "Price: \\$5\\.00"
 * ```
 */
export function escapeRegex(str: string) {
  return str.replace(/[-.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Rounds a number to a specified number of decimal places and returns it as a number.
 * @param fractionDigits — Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
 * @returns Rounded number
 */
export function toFixed(x: number, fractionDigits = 3) {
  return Number(x.toFixed(fractionDigits))
}
