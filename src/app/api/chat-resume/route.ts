import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { optimizedResume, chatHistory, userMessage } = await req.json();

    if (!optimizedResume || !userMessage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const historyPrompt = chatHistory && chatHistory.length > 0 
      ? `Previous Chat History:\n${chatHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}\n\n`
      : '';

    const prompt = `
      You are an expert executive resume writer collaborating with a user to perfect their resume.
      The user has asked you to make a change to the current resume.

      ${historyPrompt}
      Current Resume:
      ${optimizedResume}

      User's Request:
      ${userMessage}

      You must output a JSON response containing TWO fields:
      1. "message": A short, friendly confirmation of what you changed (e.g. "I've shortened the summary and made the tone more technical.")
      2. "resume": The completely updated resume in Markdown format.

      Output ONLY valid JSON. Do NOT wrap it in \`\`\`json markdown blocks.
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    
    let responseText = result.response.text();
    // Clean up potential markdown from the response
    const cleanJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(cleanJsonString);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
