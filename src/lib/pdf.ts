import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import pdfmake from "pdfmake"
import type {
  Content,
  StyleDictionary,
  StyleReference,
  TDocumentDefinitions,
  TFontDictionary
} from "pdfmake/interfaces"

// MARK: PDF fonts and styles

const SERIF_FONT = "Merriweather"
const SANS_SERIF_FONT = "OpenSans"

/** Latin WOFF only: pdfkit/fontkit subset embed can throw on WOFF2 for these families. */
const FONTSOURCE_WOFF = [
  {
    key: "Merriweather",
    specifierDir: "@fontsource/merriweather/files",
    faces: {
      normal: { vfs: "fonts/merriweather-400.woff", file: "merriweather-latin-400-normal.woff" },
      bold: { vfs: "fonts/merriweather-700.woff", file: "merriweather-latin-700-normal.woff" },
      italics: { vfs: "fonts/merriweather-400-italic.woff", file: "merriweather-latin-400-italic.woff" },
      bolditalics: { vfs: "fonts/merriweather-700-italic.woff", file: "merriweather-latin-700-italic.woff" }
    }
  },
  {
    key: "OpenSans",
    specifierDir: "@fontsource/open-sans/files",
    faces: {
      normal: { vfs: "fonts/open-sans-400.woff", file: "open-sans-latin-400-normal.woff" },
      bold: { vfs: "fonts/open-sans-700.woff", file: "open-sans-latin-700-normal.woff" },
      italics: { vfs: "fonts/open-sans-400-italic.woff", file: "open-sans-latin-400-italic.woff" },
      bolditalics: { vfs: "fonts/open-sans-700-italic.woff", file: "open-sans-latin-700-italic.woff" }
    }
  }
] as const

type FontsourceWoffFamily = (typeof FONTSOURCE_WOFF)[number]
type FontSlot = keyof FontsourceWoffFamily["faces"]

function addFontsourceWoffFonts(
  vfs: { writeFileSync(filename: string, content: Buffer): void },
  families: readonly FontsourceWoffFamily[]
) {
  const slots: FontSlot[] = ["normal", "bold", "italics", "bolditalics"]
  for (const fam of families) {
    for (const slot of slots) {
      const { vfs: vfsPath, file } = fam.faces[slot]
      const url = import.meta.resolve(`${fam.specifierDir}/${file}`)
      vfs.writeFileSync(vfsPath, readFileSync(fileURLToPath(url)))
    }
  }
  return Object.fromEntries(
    families.map(f => [
      f.key,
      {
        normal: f.faces.normal.vfs,
        bold: f.faces.bold.vfs,
        italics: f.faces.italics.vfs,
        bolditalics: f.faces.bolditalics.vfs
      }
    ])
  ) as TFontDictionary
}

type PdfmakeServer = typeof pdfmake & {
  setUrlAccessPolicy(callback: (url: string) => boolean): void
  setFonts(fonts: TFontDictionary): void
  virtualfs: { writeFileSync(filename: string, content: Buffer): void }
}

const pdfm = pdfmake as PdfmakeServer
const pdfFonts = addFontsourceWoffFonts(pdfm.virtualfs, FONTSOURCE_WOFF)
pdfm.setFonts(pdfFonts)
pdfm.setUrlAccessPolicy(() => false) // no remote embedding

const sectionStyles: StyleDictionary = {
  h1: { font: SERIF_FONT, fontSize: 22, bold: true, margin: [0, 0, 0, 4] },
  h2: {
    font: SANS_SERIF_FONT,
    color: "#2079c7",
    fontSize: 10,
    bold: true,
    margin: [0, 12, 0, 6]
  },
  h3: { font: SANS_SERIF_FONT, fontSize: 11, bold: true, margin: [0, 8, 0, 0] },
  p: { fontSize: 10, margin: [0, 0, 0, 6], color: "#444444" },
  ul: { fontSize: 10, margin: [0, 0, 0, 6], color: "#666666" },
  meta: { fontSize: 9, margin: [0, 0, 0, 2] },
  small: { font: SANS_SERIF_FONT, color: "#444444", fontSize: 8, bold: true, lineHeight: 1.5 }
}

// MARK: CV data types

type CvProfile = {
  network?: string
  username?: string
  url?: string
}

type CvBasics = {
  name?: string
  label?: string
  email?: string
  phone?: string
  url?: string
  summary?: string
  location?: {
    address?: string
    city?: string
    region?: string
    postalCode?: string
    countryCode?: string
  }
  profiles?: CvProfile[]
}

type CvSkill = {
  name?: string
  keywords?: string[]
}

type CvWork = {
  name?: string
  position?: string
  location?: string
  startDate?: string
  endDate?: string
  summary?: string
  highlights?: string[]
}

type CvProject = {
  name?: string
  description?: string
  url?: string
  highlights?: string[]
}

type CvEducation = {
  institution?: string
  area?: string
  studyType?: string
  location?: string
}

export type Cv = {
  basics?: CvBasics
  skills?: CvSkill[]
  work?: CvWork[]
  projects?: CvProject[]
  education?: CvEducation[]
}

// MARK: PDF helpers

function pushParagraph(content: Content[], text?: string, style: StyleReference = "p") {
  if (text) content.push({ text, style })
}

const MONTHS_EN_GB = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
]

/** Format ISO8601 date (YYYY, YYYY-MM, YYYY-MM-DD) in UK English short form, e.g. "Oct 2023" or "29 Jun 2014". */
function formatDateEnGb(iso?: string) {
  if (!iso) return iso
  const m = iso.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/)
  if (!m) return iso
  const [, year, month, day] = m
  if (day && month) return `${Number(day)} ${MONTHS_EN_GB[Number(month) - 1]} ${year}`
  if (month) return `${MONTHS_EN_GB[Number(month) - 1]} ${year}`
  return year
}

function cvToPdfContent(cv: Cv) {
  const content: Content[] = []

  // MARK: Basics
  const b = cv.basics

  if (b?.name) {
    content.push({ text: b.name, style: "h1" })
  }

  type HeaderPiece = { text: string; link?: string }
  const headerPieces: HeaderPiece[] = []
  if (b?.label) headerPieces.push({ text: b.label })
  if (b?.email) {
    const e = b.email
    headerPieces.push({ text: e, link: `mailto:${e}` })
  }
  if (b?.phone) headerPieces.push({ text: b.phone })
  if (b?.url) {
    headerPieces.push({
      text: b.url.replace(/^https?:\/\/(www\.)?|\/$/g, ""),
      link: b.url
    })
  }
  if (b?.location) {
    const locStr = [
      b.location.address,
      b.location.city,
      b.location.region,
      // b.location.postalCode,
      b.location.countryCode
    ]
      .filter(Boolean)
      .join(", ")
    if (locStr) headerPieces.push({ text: locStr })
  }
  if (b?.profiles?.length) {
    for (const p of b.profiles) {
      const label = p.url?.replace(/^https?:\/\/(www\.)?|\/$/g, "")
      if (!label) continue
      if (p.url) {
        headerPieces.push({ text: label, link: p.url })
      } else {
        headerPieces.push({ text: label })
      }
    }
  }
  if (headerPieces.length) {
    const sep = " — "
    const text = headerPieces.flatMap((piece, i) => (i === 0 ? [piece] : [{ text: sep }, piece]))
    content.push({ text, style: "meta" })
  }

  if (b?.summary) {
    content.push({ text: "SUMMARY", style: "h2" })
    pushParagraph(content, b.summary)
  }

  // MARK: Skills
  if (cv.skills?.length) {
    content.push({ text: "SKILLS", style: "h2" })
    const skillsFormatted: Content[] = []
    for (const s of cv.skills) {
      const kws = s.keywords?.filter(Boolean)
      if (s.name && kws?.length) {
        skillsFormatted.push({
          text: [{ text: `${s.name}: `, bold: true }, { text: kws.join(", ") }],
          margin: [0, 0, 0, 3],
          font: SANS_SERIF_FONT,
          color: "#444444",
          fontSize: 10,
          lineHeight: 0.8
        })
      }
    }
    if (skillsFormatted.length) {
      content.push(...skillsFormatted)
    }
  }

  // MARK: Work
  if (cv.work?.length) {
    content.push({ text: "EXPERIENCE", style: "h2" })
    for (const w of cv.work) {
      // company and position
      const { name, position } = w
      if (name && position) {
        content.push({
          text: [name, { text: " — " }, { text: position, bold: false, italics: true }],
          style: "h3"
        })
      } else if (name) {
        content.push({ text: name, style: "h3" })
      } else if (position) {
        content.push({ text: position, style: "h3", bold: false, italics: true })
      }

      // period and location
      const metaParts = [
        [formatDateEnGb(w.startDate), formatDateEnGb(w.endDate)].filter(Boolean).join(" – "),
        w.location
      ].filter(Boolean)
      if (metaParts.length) {
        pushParagraph(content, metaParts.join(" · "), sectionStyles.small)
      }

      // summary
      pushParagraph(content, w.summary)

      // highlights
      const hl = w.highlights?.filter(Boolean)
      if (hl?.length) {
        content.push({ ul: hl, style: "ul" })
      }
    }
  }

  // MARK: Projects
  if (cv.projects?.length) {
    content.push({ text: "PROJECTS", style: "h2" })
    for (const p of cv.projects) {
      if (p.name) content.push({ text: p.name, style: "h3" })
      if (p.url) {
        content.push({ text: [{ text: p.url, link: p.url }], style: "meta" })
      }
      pushParagraph(content, p.description)
      const hl = p.highlights?.filter(Boolean)
      if (hl?.length) {
        content.push({ ul: hl, style: "ul" })
      }
    }
  }

  // MARK: Education
  if (cv.education?.length) {
    content.push({ text: "EDUCATION", style: "h2" })
    for (const e of cv.education) {
      const { institution, area, studyType } = e
      const titleParts: { text: string; bold?: boolean }[] = []
      if (institution) titleParts.push({ text: institution, bold: true })
      if (area) {
        if (titleParts.length) titleParts.push({ text: " — " })
        titleParts.push({ text: area, bold: false })
      }
      if (studyType) {
        if (titleParts.length) titleParts.push({ text: " — " })
        titleParts.push({ text: studyType, bold: false })
      }
      if (titleParts.length) content.push({ text: titleParts, style: "h3" })
      pushParagraph(content, e.location, "meta")
    }
  }

  return content
}

// MARK: PDF rendering

export async function renderCvPdf(cv: Cv, outputPath: string) {
  const pdfContent = cvToPdfContent(cv)

  const docDefinition: TDocumentDefinitions = {
    pageMargins: [48, 48, 48, 48],
    content: pdfContent,
    defaultStyle: {
      font: SERIF_FONT,
      lineHeight: 1.2
    },
    styles: sectionStyles
  }

  const pdf = pdfm.createPdf(docDefinition)
  await pdf.write(outputPath)
}
