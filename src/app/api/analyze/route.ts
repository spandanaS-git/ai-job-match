import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: "Missing resumeText or jobDescription" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are an expert technical recruiter and ATS (Applicant Tracking System) algorithm.
      Compare the following Resume to the Job Description.

      Job Description:
      ${jobDescription}

      Resume:
      ${resumeText}

      Provide a strict JSON response with the following format. Do not use markdown wrappers like \`\`\`json. Just pure JSON.
      {
        "score": 85, // integer from 0 to 100 based on how well the resume matches the JD requirements
        "status": "Perfect Match", // 'Perfect Match' if score > 85, else 'Needs Improvement'
        "missingKeywords": [
          "Python", "AWS" // Array of exactly 3-7 short, critical technical skills or buzzwords present in the JD but missing from the resume. If perfect match, return empty array.
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up potential markdown from the response
    const cleanJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(cleanJsonString);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("AI Match Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze resume" }, { status: 500 });
  }
}
