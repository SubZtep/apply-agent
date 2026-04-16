import pdfmake from "pdfmake"
import type { Content, TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces"

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

const sectionStyles = {
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
  ul: { fontSize: 10, margin: [0, 0, 0, 6] as [number, number, number, number] },
  meta: { fontSize: 9, margin: [0, 0, 0, 2] as [number, number, number, number] }
}

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

function formatLocation(loc: NonNullable<CvBasics["location"]>) {
  const parts = [loc.address, loc.city, loc.region, loc.postalCode, loc.countryCode].filter(Boolean)
  return parts.join(", ")
}

function formatDateRange(start?: string, end?: string) {
  if (start && end) return `${start} – ${end}`
  if (start) return start
  if (end) return end
  return ""
}

function pushParagraph(content: Content[], text: string | undefined, style: "p" | "meta" = "p") {
  const t = text?.trim()
  if (t) content.push({ text: t, style })
}

function cvToPdfContent(cv: Cv) {
  const content: Content[] = []
  const b = cv.basics

  if (b?.name?.trim()) {
    content.push({ text: b.name.trim(), style: "h1" })
  }
  if (b?.label?.trim()) {
    content.push({ text: b.label.trim(), style: "p" })
  }

  const contactLine: { text: string; link?: string }[] = []
  if (b?.email?.trim()) {
    const e = b.email.trim()
    contactLine.push({ text: e, link: `mailto:${e}` })
  }
  if (b?.phone?.trim()) {
    if (contactLine.length) contactLine.push({ text: " · " })
    contactLine.push({ text: b.phone.trim() })
  }
  if (b?.url?.trim()) {
    if (contactLine.length) contactLine.push({ text: " · " })
    const u = b.url.trim()
    contactLine.push({ text: u, link: u })
  }
  if (contactLine.length) {
    content.push({ text: contactLine, style: "meta" })
  }

  if (b?.location) {
    const locStr = formatLocation(b.location).trim()
    if (locStr) pushParagraph(content, locStr, "meta")
  }

  if (b?.profiles?.length) {
    const profileBits: { text: string; link?: string }[] = []
    for (const p of b.profiles) {
      const label = [p.network, p.username].filter(Boolean).join(": ") || p.url
      if (!label?.trim()) continue
      if (profileBits.length) profileBits.push({ text: " · " })
      const u = p.url?.trim()
      profileBits.push(u ? { text: label.trim(), link: u } : { text: label.trim() })
    }
    if (profileBits.length) {
      content.push({ text: profileBits, style: "meta" })
    }
  }

  if (b?.summary?.trim()) {
    content.push({ text: "Summary", style: "h2" })
    pushParagraph(content, b.summary)
  }

  if (cv.skills?.length) {
    content.push({ text: "Skills", style: "h2" })
    for (const s of cv.skills) {
      const title = s.name?.trim()
      if (title) content.push({ text: title, style: "h3" })
      const kws = s.keywords?.filter(k => k.trim())
      if (kws?.length) {
        content.push({ ul: kws, style: "ul" })
      }
    }
  }

  if (cv.work?.length) {
    content.push({ text: "Experience", style: "h2" })
    for (const w of cv.work) {
      const company = w.name?.trim()
      const role = w.position?.trim()
      const heading = company && role ? `${company} — ${role}` : company || role || "Role"
      content.push({ text: heading, style: "h3" })

      const metaParts = [formatDateRange(w.startDate, w.endDate), w.location?.trim()].filter(Boolean)
      if (metaParts.length) {
        pushParagraph(content, metaParts.join(" · "), "meta")
      }
      pushParagraph(content, w.summary)
      const hl = w.highlights?.map(h => h.trim()).filter(Boolean)
      if (hl?.length) {
        content.push({ ul: hl, style: "ul" })
      }
    }
  }

  if (cv.projects?.length) {
    content.push({ text: "Projects", style: "h2" })
    for (const p of cv.projects) {
      if (p.name?.trim()) content.push({ text: p.name.trim(), style: "h3" })
      const u = p.url?.trim()
      if (u) {
        content.push({ text: [{ text: u, link: u }], style: "meta" })
      }
      pushParagraph(content, p.description)
      const hl = p.highlights?.map(h => h.trim()).filter(Boolean)
      if (hl?.length) {
        content.push({ ul: hl, style: "ul" })
      }
    }
  }

  if (cv.education?.length) {
    content.push({ text: "Education", style: "h2" })
    for (const e of cv.education) {
      const title = [e.institution, e.area, e.studyType].filter(Boolean).join(" — ")
      if (title.trim()) content.push({ text: title.trim(), style: "h3" })
      pushParagraph(content, e.location, "meta")
    }
  }

  return content
}

export async function renderCvPdf(cv: Cv, outputPath: string) {
  const pdfContent = cvToPdfContent(cv)

  const docDefinition: TDocumentDefinitions = {
    pageMargins: [48, 48, 48, 48],
    content: pdfContent,
    defaultStyle: {
      font: BODY_FONT,
      lineHeight: 1.45
    },
    styles: sectionStyles
  }

  const pdf = pdfm.createPdf(docDefinition)
  await pdf.write(outputPath)
}
