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
    color: "#2079c7",
    fontSize: 10,
    bold: true,
    margin: [0, 12, 0, 6]
  },
  h3: { font: SANS_SERIF_FONT, fontSize: 11, bold: true, margin: [0, 8, 0, 2] },
  p: { fontSize: 10, margin: [0, 0, 0, 6] },
  ul: { fontSize: 10, margin: [0, 0, 0, 6] },
  meta: { fontSize: 9, margin: [0, 0, 0, 2] },
  small: { font: SANS_SERIF_FONT, color: "#666666", fontSize: 8, bold: true, margin: [0, 0, 0, 122] }
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

function cvToPdfContent(cv: Cv) {
  const content: Content[] = []

  // MARK: Basics
  const b = cv.basics

  if (b?.name) {
    content.push({ text: b.name, style: "h1" })
  }
  const metaLine: { text: string; link?: string }[] = []
  if (b?.label) metaLine.push({ text: b.label })
  if (b?.email) {
    if (metaLine.length) metaLine.push({ text: " · " })
    const e = b.email
    metaLine.push({ text: e, link: `mailto:${e}` })
  }
  if (b?.phone) {
    if (metaLine.length) metaLine.push({ text: " · " })
    metaLine.push({ text: b.phone })
  }
  if (b?.url) {
    if (metaLine.length) metaLine.push({ text: " · " })
    const u = b.url
    metaLine.push({ text: u, link: u })
  }
  if (b?.location) {
    const locStr = [
      b.location.address,
      b.location.city,
      b.location.region,
      b.location.postalCode,
      b.location.countryCode
    ]
      .filter(Boolean)
      .join(", ")

    if (locStr) {
      if (metaLine.length) metaLine.push({ text: " · " })
      metaLine.push({ text: locStr })
    }
  }
  if (metaLine.length) {
    content.push({ text: metaLine, style: "meta" })
  }

  if (b?.profiles?.length) {
    for (const p of b.profiles) {
      const label = /*[p.network, p.username].filter(Boolean).join(": ") || */ p.url
      if (label) {
        if (metaLine.length) metaLine.push({ text: " · " })
        metaLine.push(p.url ? { text: label, link: p.url } : { text: label })
      }
    }
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
      content.push({ text: [w.name, w.position].join(" — "), style: "h3" })
      const metaParts = [[w.startDate, w.endDate].filter(Boolean).join(" – "), w.location].filter(Boolean)
      if (metaParts.length) {
        pushParagraph(content, metaParts.join(" · "), sectionStyles.small)
      }
      pushParagraph(content, w.summary)
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
      const title = [e.institution, e.area, e.studyType].filter(Boolean).join(" — ")
      if (title) content.push({ text: title, style: "h3" })
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
