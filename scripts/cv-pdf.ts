#!/usr/bin/env bun
import path from "node:path"
import { renderCvPdf } from "#/lib/pdf"

const args = process.argv.slice(2).filter((a) => a !== "--")
if (args.length < 1) {
  console.error("Usage: bun scripts/cv-pdf.ts <input.md> [output.pdf]")
  process.exit(1)
}

const inputPath = path.resolve(args[0])
const outputPath =
  args[1] !== undefined
    ? path.resolve(args[1])
    : path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}.pdf`)

const inputFile = Bun.file(inputPath)
if (!(await inputFile.exists())) {
  console.error(`Input not found: ${inputPath}`)
  process.exit(1)
}

const markdown = await inputFile.text()
await renderCvPdf(markdown, outputPath)
console.error(`Wrote ${outputPath}`)
