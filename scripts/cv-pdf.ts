#!/usr/bin/env bun
import path from "node:path"
import type { Cv } from "#/lib/pdf"
import { renderCvPdf } from "#/lib/pdf"

const args = process.argv.slice(2).filter((a) => a !== "--")

const defaultInput = path.join(import.meta.dir, "..", "data", "cv.json")
const inputPath =
  args[0] !== undefined ? path.resolve(args[0]) : path.resolve(defaultInput)
const outputPath =
  args[1] !== undefined
    ? path.resolve(args[1])
    : path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}.pdf`)

if (args.length > 2) {
  console.error("Usage: bun scripts/cv-pdf.ts [input.json] [output.pdf]")
  console.error("  Defaults: data/cv.json → data/cv.pdf")
  process.exit(1)
}

const inputFile = Bun.file(inputPath)
if (!(await inputFile.exists())) {
  console.error(`Input not found: ${inputPath}`)
  process.exit(1)
}

let cv: Cv
try {
  cv = JSON.parse(await inputFile.text()) as Cv
} catch (e) {
  console.error(`Invalid JSON: ${inputPath}`, e)
  process.exit(1)
}

await renderCvPdf(cv, outputPath)
console.error(`Wrote ${outputPath}`)
