import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";

interface ExportBody {
  text: string;
  bookTitle?: string;
  author?: string;
  pageNumber?: number;
  searchTerm?: string;
}

// POST /api/export/docx — generates a .docx with correct RTL paragraphs for Arabic/Urdu text
export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExportBody;
  const { text, bookTitle, author, pageNumber, searchTerm } = body;

  if (!text?.trim()) {
    return NextResponse.json({ error: "کوئی متن منتخب نہیں کیا گیا۔" }, { status: 400 });
  }

  const metaParagraphs: Paragraph[] = [];
  if (bookTitle) {
    metaParagraphs.push(
      new Paragraph({
        text: bookTitle,
        heading: HeadingLevel.HEADING_2,
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
      })
    );
  }
  const metaBits: string[] = [];
  if (author) metaBits.push(`مصنف: ${author}`);
  if (pageNumber) metaBits.push(`صفحہ: ${pageNumber}`);
  if (searchTerm) metaBits.push(`تلاش کردہ لفظ: ${searchTerm}`);
  if (metaBits.length) {
    metaParagraphs.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: metaBits.join(" | "), italics: true, size: 20 })],
      }),
      new Paragraph({ text: "" })
    );
  }

  const bodyParagraphs = text
    .split(/\n+/)
    .filter((line) => line.trim().length > 0)
    .map(
      (line) =>
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: line, rightToLeft: true, size: 26 })],
        })
    );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [...metaParagraphs, ...bodyParagraphs],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="miftah-export.docx"`,
    },
  });
}
