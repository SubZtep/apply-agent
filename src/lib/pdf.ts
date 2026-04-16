import type { PhrasingContent } from "mdast"
import pdfmake from "pdfmake"
import type { Content, TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces"
import remarkParse from "remark-parse"
import { unified } from "unified"

const BODY_FONT = "Helvetica"
const HEADER_FONT = "Times"
const SUBHEADER_FONT = "Courier"

type PdfmakeServer = typeof pdfmake & {
  setUrlAccessPolicy(callback: (url: string) => boolean): void
  setFonts(fonts: TFontDictionary): void
}

function assertFontRegistered(family: string, fonts: TFontDictionary) {
  if (!(family in fonts)) {
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
  }
}

const pdfm = pdfmake as PdfmakeServer
pdfm.setFonts(pdfFonts)
assertFontRegistered(BODY_FONT, pdfFonts)
assertFontRegistered(HEADER_FONT, pdfFonts)
assertFontRegistered(SUBHEADER_FONT, pdfFonts)
pdfm.setUrlAccessPolicy(() => false)

const markdownStyles = {
  h1: { font: HEADER_FONT, fontSize: 22, bold: true, margin: [0, 0, 0, 4] as [number, number, number, number] },
  h2: {
    font: SUBHEADER_FONT,
    color: "#2079c7",
    fontSize: 10,
    bold: true,
    margin: [0, 12, 0, 6] as [number, number, number, number]
  },
  h3: { font: HEADER_FONT, fontSize: 11, bold: true, margin: [0, 8, 0, 2] as [number, number, number, number] },
  p: { fontSize: 10, margin: [0, 0, 0, 6] as [number, number, number, number] },
  ul: { fontSize: 10, margin: [0, 0, 0, 6] as [number, number, number, number] }
}

type TextRun = { text: string; bold?: boolean; italics?: boolean; link?: string }

function simplifyRuns(runs: TextRun[]) {
  if (runs.length === 0) return ""
  if (runs.length === 1 && runs[0].bold !== true && runs[0].italics !== true && runs[0].link === undefined) {
    return runs[0].text
  }
  return runs
}

function parseInlineRuns(nodes: PhrasingContent[], activeStyles: Omit<TextRun, "text"> = {}) {
  const runs: TextRun[] = []

  for (const node of nodes) {
    if (node.type === "text" || node.type === "inlineCode") {
      if (node.value) {
        runs.push({ text: node.value, ...activeStyles })
      }
      continue
    }

    if (node.type === "break") {
      runs.push({ text: "\n", ...activeStyles })
      continue
    }

    if (node.type === "strong") {
      runs.push(...parseInlineRuns(node.children, { ...activeStyles, bold: true }))
      continue
    }

    if (node.type === "emphasis") {
      runs.push(...parseInlineRuns(node.children, { ...activeStyles, italics: true }))
      continue
    }

    if (node.type === "link") {
      runs.push(...parseInlineRuns(node.children, { ...activeStyles, link: node.url }))
    }
  }

  return runs
}

function parseCvMarkdown(markdown: string): Content[] {
  const tree = unified().use(remarkParse).parse(markdown)
  const content: Content[] = []

  for (const block of tree.children) {
    if (block.type === "heading") {
      const runs = parseInlineRuns(block.children)
      if (runs.length === 0) continue
      const headingStyle = block.depth === 1 ? "h1" : block.depth === 2 ? "h2" : "h3"
      content.push({ text: simplifyRuns(runs), style: headingStyle })
      continue
    }

    if (block.type === "paragraph") {
      const runs = parseInlineRuns(block.children)
      if (runs.length === 0) continue
      content.push({ text: simplifyRuns(runs), style: "p" })
      continue
    }

    if (block.type === "list") {
      const items = block.children.map(item => {
        const itemRuns: TextRun[] = []
        for (const child of item.children) {
          if (child.type !== "paragraph") continue
          if (itemRuns.length > 0) itemRuns.push({ text: "\n" })
          itemRuns.push(...parseInlineRuns(child.children))
        }
        return simplifyRuns(itemRuns)
      })
      content.push({ ul: items, style: "ul" })
    }
  }

  return content
}

export async function renderCvPdf(markdown: string, outputPath: string) {
  const pdfContent = parseCvMarkdown(markdown)

  const docDefinition: TDocumentDefinitions = {
    pageMargins: [48, 48, 48, 48],
    content: pdfContent,
    defaultStyle: {
      font: BODY_FONT,
      lineHeight: 1.45
    },
    styles: markdownStyles
  }

  const pdf = pdfm.createPdf(docDefinition)
  await pdf.write(outputPath)
}
