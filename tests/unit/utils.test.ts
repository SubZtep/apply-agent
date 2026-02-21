import { describe, expect, it } from "bun:test"
import { escapeRegex } from "#/lib/utils"

describe("escapeRegex", () => {
  // Basic functionality
  it("should return empty string for empty input", () => {
    expect(escapeRegex("")).toBe("")
  })

  it("should return unchanged string with no special characters", () => {
    expect(escapeRegex("hello world")).toBe("hello world")
    expect(escapeRegex("abc123")).toBe("abc123")
    expect(escapeRegex("foo_bar")).toBe("foo_bar")
  })

  // Individual special characters
  it("should escape period (.)", () => {
    expect(escapeRegex(".")).toBe("\\.")
    expect(escapeRegex("file.txt")).toBe("file\\.txt")
  })

  it("should escape asterisk (*)", () => {
    expect(escapeRegex("*")).toBe("\\*")
    expect(escapeRegex("C++")).toBe("C\\+\\+") // Wait, this tests + not *
    expect(escapeRegex("a*b")).toBe("a\\*b")
  })

  it("should escape plus (+)", () => {
    expect(escapeRegex("+")).toBe("\\+")
    expect(escapeRegex("C++")).toBe("C\\+\\+")
  })

  it("should escape question mark (?)", () => {
    expect(escapeRegex("?")).toBe("\\?")
    expect(escapeRegex("Really?")).toBe("Really\\?")
  })

  it("should escape caret (^)", () => {
    expect(escapeRegex("^")).toBe("\\^")
    expect(escapeRegex("2^3")).toBe("2\\^3")
  })

  it("should escape dollar sign ($)", () => {
    expect(escapeRegex("$")).toBe("\\$")
    expect(escapeRegex("$100")).toBe("\\$100")
  })

  it("should escape curly braces ({})", () => {
    expect(escapeRegex("{}")).toBe("\\{\\}")
    expect(escapeRegex("{foo}")).toBe("\\{foo\\}")
    expect(escapeRegex("a{3}")).toBe("a\\{3\\}")
  })

  it("should escape parentheses (())", () => {
    expect(escapeRegex("()")).toBe("\\(\\)")
    expect(escapeRegex("(foo)")).toBe("\\(foo\\)")
  })

  it("should escape pipe (|)", () => {
    expect(escapeRegex("|")).toBe("\\|")
    expect(escapeRegex("a|b")).toBe("a\\|b")
  })

  it("should escape square brackets ([])", () => {
    expect(escapeRegex("[]")).toBe("\\[\\]")
    expect(escapeRegex("[foo]")).toBe("\\[foo\\]")
  })

  it("should escape backslash (\\)", () => {
    expect(escapeRegex("\\")).toBe("\\\\")
    expect(escapeRegex("C:\\Users")).toBe("C:\\\\Users")
  })

  it("should escape hyphen (-)", () => {
    expect(escapeRegex("-")).toBe("\\-")
    expect(escapeRegex("A-Z")).toBe("A\\-Z")
    expect(escapeRegex("foo-bar")).toBe("foo\\-bar")
  })

  // Complex cases
  it("should escape multiple special characters", () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: intentional test data containing regex special chars
    const input = ".*+?^${}()|[\\]\\-"
    const expected = "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\\\\\]\\\\\\-"
    expect(escapeRegex(input)).toBe(expected)
  })

  it("should handle real-world regex patterns as literals", () => {
    // These are common things users might search for that look like regex
    expect(escapeRegex("(555) 123-4567")).toBe("\\(555\\) 123\\-4567")
    expect(escapeRegex("price: $5.00")).toBe("price: \\$5\\.00")
    expect(escapeRegex("C:\\\\Windows\\\\System32")).toBe("C:\\\\\\\\Windows\\\\\\\\System32")
    expect(escapeRegex("[ERROR] File not found")).toBe("\\[ERROR\\] File not found")
    expect(escapeRegex("What?!")).toBe("What\\?!")
  })

  // Integration tests - verify the escaped strings actually work in regex
  describe("integration with RegExp", () => {
    it("should create valid regex that matches literal text", () => {
      const dangerous = "($10.00)"
      const escaped = escapeRegex(dangerous)
      const regex = new RegExp(escaped)

      expect(dangerous).toMatch(regex)
      expect("($10.00) is the price").toMatch(regex)
      expect("($20.00)").not.toMatch(regex) // Different number
    })

    it("should prevent regex injection attacks", () => {
      const maliciousInput = ".*" // Would match everything if not escaped
      const escaped = escapeRegex(maliciousInput)
      const regex = new RegExp(`^${escaped}$`)

      // Should only match the literal string ".*"
      expect(".*").toMatch(regex)
      expect("anything else").not.toMatch(regex)
      expect("hello world").not.toMatch(regex)
    })

    it("should work correctly in character classes when hyphen is escaped", () => {
      const input = "A-Z"
      const escaped = escapeRegex(input)

      // When used inside a character class, unescaped hyphen would create range
      // But with escaping, it should match literal "A-Z"
      const regex = new RegExp(`[${escaped}]`)

      // This regex should match the characters A, -, or Z individually
      // (because inside [] each escaped char is separate)
      expect("A").toMatch(regex)
      expect("Z").toMatch(regex)
      expect("-").toMatch(regex)
      expect("B").not.toMatch(regex) // B is in A-Z range but not in [A\-Z]
    })

    it("should work with regex replace operations", () => {
      const text = "Price: $5.00 (50% off)"
      const search = "$5.00 (50%"
      const escaped = escapeRegex(search)

      const result = text.replace(new RegExp(escaped), "REPLACED")
      expect(result).toBe("Price: REPLACED off)")
    })
  })

  // Edge cases
  it("should handle unicode and emojis (no special regex meaning)", () => {
    expect(escapeRegex("hello 🌍")).toBe("hello 🌍")
    expect(escapeRegex("café")).toBe("café")
    expect(escapeRegex("日本語")).toBe("日本語")
  })

  it("should handle very long strings", () => {
    const longString = `${"a".repeat(1000)}.${"b".repeat(1000)}`
    const result = escapeRegex(longString)
    expect(result).toBe(`${"a".repeat(1000)}\\.${"b".repeat(1000)}`)
    expect(result.length).toBe(longString.length + 1) // +1 for the backslash
  })

  it("should handle strings with only special characters", () => {
    expect(escapeRegex(".*?")).toBe("\\.\\*\\?")
  })

  it("should handle consecutive special characters", () => {
    expect(escapeRegex("...")).toBe("\\.\\.\\.")
    expect(escapeRegex("\\\\\\")).toBe("\\\\\\\\\\\\") // 3 backslashes become 6 backslashes in output
  })
})
