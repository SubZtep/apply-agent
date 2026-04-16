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

const markdownParser = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false
})

const styles = {
  heading1: {
    font: HEADER_FONT,
    fontSize: 22,
    bold: true,
    margin: [0, 0, 0, 6] as [number, number, number, number]
  },
  heading2: {
    font: HEADER_FONT,
    fontSize: 13,
    bold: true,
    margin: [0, 12, 0, 6] as [number, number, number, number]
  },
  heading3: {
    font: HEADER_FONT,
    fontSize: 11,
    bold: true,
    margin: [0, 8, 0, 4] as [number, number, number, number]
  },
  paragraph: {
    fontSize: 10,
    margin: [0, 0, 0, 6] as [number, number, number, number]
  },
  list: {
    fontSize: 10,
    margin: [0, 0, 0, 6] as [number, number, number, number]
  }
}

function getHeadingStyle(level: number) {
  if (level === 1) return styles.heading1
  if (level === 2) return styles.heading2
  return styles.heading3
}

function inlineTokenToPdfText(inlineToken: NonNullable<ReturnType<typeof markdownParser.parse>[number]>) {
  const children = inlineToken.children ?? []
  const textParts: Array<{
    text: string
    bold?: true
    italics?: true
    link?: string
    decoration?: "underline"
  }> = []
  const styleStack: Array<{
    bold?: true
    italics?: true
    link?: string
    decoration?: "underline"
  }> = [{}]

  function currentStyle() {
    return styleStack[styleStack.length - 1] ?? {}
  }

  for (const token of children) {
    if (token.type === "strong_open") {
      styleStack.push({ ...currentStyle(), bold: true })
      continue
    }
    if (token.type === "em_open") {
      styleStack.push({ ...currentStyle(), italics: true })
      continue
    }
    if (token.type === "link_open") {
      const href = token.attrs?.find(([name]) => name === "href")?.[1]
      styleStack.push({
        ...currentStyle(),
        ...(href == null ? {} : { link: href, decoration: "underline" as const })
      })
      continue
    }
    if (token.type === "strong_close" || token.type === "em_close" || token.type === "link_close") {
      if (styleStack.length > 1) styleStack.pop()
      continue
    }

    if (token.type === "softbreak" || token.type === "hardbreak") {
      textParts.push({ ...currentStyle(), text: "\n" })
      continue
    }
    if (token.type === "code_inline") {
      textParts.push({ ...currentStyle(), text: token.content })
      continue
    }
    if (token.type === "text") {
      textParts.push({ ...currentStyle(), text: token.content })
      continue
    }
  }

  if (textParts.length === 0) return ""

  const plainTextOnly = textParts.every(
    (part) =>
      part.bold == null && part.italics == null && part.link == null && part.decoration == null
  )

  if (plainTextOnly) {
    return textParts.map((part) => part.text).join("")
  }

  return textParts
}

function parseCvMarkdown(markdown: string): Content[] {
  const tokens = markdownParser.parse(markdown, {})
  const content: Content[] = []
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token == null) continue

    if (token.type === "heading_open") {
      const level = Number(token.tag.slice(1))
      const inlineToken = tokens[i + 1]
      if (inlineToken?.type === "inline") {
        content.push({
          ...getHeadingStyle(level),
          text: inlineTokenToPdfText(inlineToken)
        })
      }
      continue
    }

    if (token.type === "paragraph_open") {
      const inlineToken = tokens[i + 1]
      if (inlineToken?.type === "inline") {
        content.push({
          ...styles.paragraph,
          text: inlineTokenToPdfText(inlineToken)
        })
      }
      continue
    }

    if (token.type === "bullet_list_open") {
      const items: Array<
        | string
        | Array<{ text: string; bold?: true; italics?: true; link?: string; decoration?: "underline" }>
      > = []
      let listCursor = i + 1
      while (tokens[listCursor]?.type !== "bullet_list_close" && listCursor < tokens.length) {
        const listToken = tokens[listCursor]
        if (listToken?.type !== "list_item_open") {
          listCursor += 1
          continue
        }

        let itemText:
          | string
          | Array<{ text: string; bold?: true; italics?: true; link?: string; decoration?: "underline" }>
          | null = null
        listCursor += 1
        while (tokens[listCursor]?.type !== "list_item_close" && listCursor < tokens.length) {
          const innerToken = tokens[listCursor]
          if (innerToken?.type === "inline") {
            itemText = inlineTokenToPdfText(innerToken)
          }
          listCursor += 1
        }

        if (itemText != null && itemText !== "") {
          items.push(itemText)
        }
        listCursor += 1
      }

      if (items.length > 0) {
        content.push({
          ...styles.list,
          ul: items
        })
      }
      i = listCursor
    }
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
    }
  }

  const pdf = pdfm.createPdf(docDefinition)
  await pdf.write(outputPath)
  console.error(`Wrote ${outputPath}`)
}

await main()
