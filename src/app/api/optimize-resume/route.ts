export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { resumeText, jobDescription, missingKeywords } = await req.json();

    if (!resumeText) {
      return NextResponse.json({ error: "Missing resume text" }, { status: 400 });
    }

    const prompt = `
      You are an expert executive resume writer. 
      Your task is to professionally rewrite the user's Resume to naturally incorporate the following Missing Keywords, while tailoring it for the provided Job Description.

      Job Description:
      ${jobDescription || 'N/A'}

      Missing Keywords to seamlessly integrate:
      ${missingKeywords ? missingKeywords.join(', ') : 'None'}

      Original Resume:
      ${resumeText}

      Output the completely optimized resume in clean Markdown format. Use proper headings (##), bullet points, and bolding.
      Do not include any conversational text before or after the resume. Output ONLY the markdown resume.
    `;

    const modelsToTry = [
      "gemini-1.5-pro",
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-pro"
    ];
    
    let optimizedText = "";
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        optimizedText = result.response.text();
        break;
      } catch (err) {
        lastError = err;
        console.log(`Failed with model ${modelName}`, err);
      }
    }

    if (!optimizedText) {
      throw lastError || new Error("All fallback models failed.");
    }
    // Strip markdown wrappers if the model wrapped it in ```markdown
    if (optimizedText.startsWith('```markdown')) {
      optimizedText = optimizedText.replace(/```markdown\n/, '').replace(/```$/, '');
    }

    return NextResponse.json({ optimizedResume: optimizedText.trim() });

  } catch (error: any) {
    console.error("Optimize Error:", error);
    return NextResponse.json({ error: error.message || "Failed to optimize resume" }, { status: 500 });
  }
}
