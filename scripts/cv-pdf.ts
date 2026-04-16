#!/usr/bin/env bun
import path from "node:path"
import pdfmake from "pdfmake"
import type { Content, TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces"

const BODY_FONT = "Helvetica"
const HEADER_FONT = "Times"

type PdfmakeServer = typeof pdfmake & {
  setUrlAccessPolicy(callback: (url: string) => boolean): void
  setFonts(fonts: TFontDictionary): void
}

function assertFontRegistered(family: string, fonts: TFontDictionary) {
  if (fonts[family] == null) {
    throw new Error(`Font family "${family}" is not registered. Available: ${Object.keys(fonts).join(", ")}`)
  }
}

const pdfFonts: TFontDictionary = {
  Courier: {
    normal: "Courier",
    bold: "Courier-Bold",
    italics: "Courier-Oblique",
    bolditalics: "Courier-BoldOblique"
  },
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique"
  },
  Times: {
    normal: "Times-Roman",
    bold: "Times-Bold",
    italics: "Times-Italic",
    bolditalics: "Times-BoldItalic"
  },
  Symbol: {
    normal: "Symbol"
  },
  ZapfDingbats: {
    normal: "ZapfDingbats"
  }
}

const pdfm = pdfmake as PdfmakeServer
pdfm.setFonts(pdfFonts)
assertFontRegistered(BODY_FONT, pdfFonts)
assertFontRegistered(HEADER_FONT, pdfFonts)
void pdfm.setUrlAccessPolicy(() => false)

function parseCvMarkdown(markdown: string): Content[] {
  const lines = markdown.split(/\n/)
  const content: Content[] = []
  const pendingPara: string[] = []
  const pendingBullets: string[] = []
  let nextParagraphIsSubtitle = false

  function flushParagraph() {
    if (pendingPara.length === 0) return
    const text = pendingPara.join(" ").trim()
    pendingPara.length = 0
    if (!text) return

    if (nextParagraphIsSubtitle) {
      nextParagraphIsSubtitle = false
      content.push({
        text,
        font: HEADER_FONT,
        fontSize: 11,
        bold: true,
        margin: [0, 0, 0, 6]
      })
      return
    }

    content.push({
      text,
      fontSize: 10,
      margin: [0, 0, 0, 6]
    })
  }

  function flushBullets() {
    if (pendingBullets.length === 0) return
    const items = pendingBullets.splice(0, pendingBullets.length)
    content.push({
      ul: items,
      fontSize: 10,
      margin: [0, 0, 0, 6]
    })
  }

  function flushBulletsIfLineIsNotBullet(line: string) {
    if (pendingBullets.length === 0) return
    if (line.startsWith("- ")) return
    flushBullets()
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (trimmed === "") {
      flushParagraph()
      continue
    }

    if (trimmed.startsWith("# ")) {
      flushBullets()
      flushParagraph()
      content.push({
        text: trimmed.slice(2),
        font: HEADER_FONT,
        fontSize: 22,
        bold: true,
        margin: [0, 0, 0, 4]
      })
      nextParagraphIsSubtitle = true
      continue
    }

    if (trimmed.startsWith("## ")) {
      flushBullets()
      flushParagraph()
      content.push({
        text: trimmed.slice(3),
        font: HEADER_FONT,
        fontSize: 13,
        bold: true,
        margin: [0, 12, 0, 6]
      })
      continue
    }

    if (trimmed.startsWith("### ")) {
      flushBullets()
      flushParagraph()
      content.push({
        text: trimmed.slice(4),
        font: HEADER_FONT,
        fontSize: 11,
        bold: true,
        margin: [0, 8, 0, 2]
      })
      continue
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph()
      pendingBullets.push(trimmed.slice(2).trim())
      continue
    }

    if (trimmed.startsWith("Skills used:")) {
      flushBullets()
      flushParagraph()
      const rest = trimmed.slice("Skills used:".length).trim()
      content.push({
        margin: [0, 0, 0, 8],
        text: [
          { text: "Skills used: ", bold: true, fontSize: 9 },
          { text: rest, italics: true, fontSize: 9 }
        ]
      })
      continue
    }

    flushBulletsIfLineIsNotBullet(trimmed)
    pendingPara.push(trimmed)
  }

  flushBullets()
  flushParagraph()

  return content
}

async function main() {
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
  const pdfContent = parseCvMarkdown(markdown)


  const docDefinition: TDocumentDefinitions = {
    pageMargins: [48, 48, 48, 48],
    content: pdfContent,
    defaultStyle: {
      font: BODY_FONT,
      lineHeight: 1.35
    }
  }

  const pdf = pdfm.createPdf(docDefinition)
  await pdf.write(outputPath)
  console.error(`Wrote ${outputPath}`)
}

await main()
