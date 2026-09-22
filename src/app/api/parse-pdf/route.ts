import { NextResponse } from "next/server";
import PDFParser from "pdf2json";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const pdfParser = new (PDFParser as any)(null, 1);

    const text = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });
      pdfParser.parseBuffer(buffer);
    });

    const cleanText = (text || "").replace(/\\r\\n/g, "\\n").trim();
    return NextResponse.json({ text: cleanText });
  } catch (err: any) {
    console.error("PDF Parse Server Error:", err);
    return NextResponse.json({ error: err.message || "Failed to parse PDF" }, { status: 500 });
  }
}
