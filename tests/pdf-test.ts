import pdfmake from "pdfmake"

const fonts = {
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

pdfmake.addFonts(fonts)

var docDefinition = {
  content: [
    "First paragraph",
    "Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines",
    { text: "This paragraph will have a bigger font", fontSize: 21 },
    { text: "That's the one", fontSize: 18, font: "ZapfDingbats" },
    { text: "This paragraph will have a better font", fontSize: 18, font: "Times" }
  ],
  defaultStyle: {
    font: "Helvetica"
  }
}

const pdf = pdfmake.createPdf(docDefinition)
await pdf.write("basics.pdf")
