#!/usr/bin/env bun
import path from "node:path"
import MarkdownIt from "markdown-it"
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

const md = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: true
})

const markdownStyles = {
  h1: { font: HEADER_FONT, fontSize: 22, bold: true, margin: [0, 0, 0, 4] as [number, number, number, number] },
  h2: { font: HEADER_FONT, fontSize: 13, bold: true, margin: [0, 12, 0, 6] as [number, number, number, number] },
  h3: { font: HEADER_FONT, fontSize: 11, bold: true, margin: [0, 8, 0, 2] as [number, number, number, number] },
  p: { fontSize: 10, margin: [0, 0, 0, 6] as [number, number, number, number] },
  ul: { fontSize: 10, margin: [0, 0, 0, 6] as [number, number, number, number] }
}

function simplifyRuns(
  runs: Array<{ text: string; bold?: boolean; italics?: boolean; link?: string }>
) {
  if (runs.length === 0) return ""
  if (runs.length === 1 && runs[0].bold !== true && runs[0].italics !== true && runs[0].link === undefined) {
    return runs[0].text
  }
  return runs
}

function parseInlineRuns(token: { children?: Array<{ type: string; content: string; attrGet?: (name: string) => string | null }> }) {
  const runs: Array<{ text: string; bold?: boolean; italics?: boolean; link?: string }> = []
  if (token.children == null) return runs

  let strongDepth = 0
  let emDepth = 0
  let activeLink: string | undefined

  for (const child of token.children) {
    if (child.type === "strong_open") {
      strongDepth += 1
      continue
    }
    if (child.type === "strong_close") {
      strongDepth = Math.max(0, strongDepth - 1)
      continue
    }
    if (child.type === "em_open") {
      emDepth += 1
      continue
    }
    if (child.type === "em_close") {
      emDepth = Math.max(0, emDepth - 1)
      continue
    }
    if (child.type === "link_open") {
      activeLink = child.attrGet?.("href") ?? undefined
      continue
    }
    if (child.type === "link_close") {
      activeLink = undefined
      continue
    }

    const text = child.type === "softbreak" || child.type === "hardbreak" ? "\n" : child.content
    if (!text) continue

    runs.push({
      text,
      bold: strongDepth > 0 ? true : undefined,
      italics: emDepth > 0 ? true : undefined,
      link: activeLink
    })
  }

  return runs
}

function parseCvMarkdown(markdown: string): Content[] {
  const tokens = md.parse(markdown, {})
  const content: Content[] = []

  let pendingHeadingLevel: number | null = null
  const listStack: Array<{ items: Array<string | Array<{ text: string; bold?: boolean; italics?: boolean; link?: string }>>; currentItem: Array<{ text: string; bold?: boolean; italics?: boolean; link?: string }> }> = []

  for (const token of tokens) {
    if (token.type === "heading_open") {
      pendingHeadingLevel = Number.parseInt(token.tag.slice(1), 10)
      continue
    }

    if (token.type === "heading_close") {
      pendingHeadingLevel = null
      continue
    }

    if (token.type === "bullet_list_open") {
      listStack.push({ items: [], currentItem: [] })
      continue
    }

    if (token.type === "bullet_list_close") {
      const list = listStack.pop()
      if (list == null) continue
      if (listStack.length > 0) continue
      const listNode: Content = { ul: list.items, style: "ul" }
      content.push(listNode)
      continue
    }

    if (token.type === "list_item_open") {
      if (listStack.length > 0) {
        listStack[listStack.length - 1].currentItem = []
      }
      continue
    }

    if (token.type === "list_item_close") {
      if (listStack.length === 0) continue
      const currentList = listStack[listStack.length - 1]
      currentList.items.push(simplifyRuns(currentList.currentItem))
      currentList.currentItem = []
      continue
    }

    if (token.type !== "inline") continue

    const inlineRuns = parseInlineRuns(token)
    if (inlineRuns.length === 0) continue

    if (pendingHeadingLevel !== null) {
      const headingStyle = pendingHeadingLevel === 1 ? "h1" : pendingHeadingLevel === 2 ? "h2" : "h3"
      content.push({ text: simplifyRuns(inlineRuns), style: headingStyle })
      continue
    }

    if (listStack.length > 0) {
      const currentList = listStack[listStack.length - 1]
      currentList.currentItem.push(...inlineRuns)
      continue
    }

    content.push({
      text: simplifyRuns(inlineRuns),
      style: "p"
    })
  }

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
    },
    styles: markdownStyles
  }

  const pdf = pdfm.createPdf(docDefinition)
  await pdf.write(outputPath)
  console.error(`Wrote ${outputPath}`)
}

await main()
