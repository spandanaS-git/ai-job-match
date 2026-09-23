import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription, jobTitle, missingKeywords } = await req.json();

    if (!resumeText || (!jobDescription && !jobTitle)) {
      return new Response(JSON.stringify({ error: "Missing resumeText or job details" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const missingList = Array.isArray(missingKeywords) && missingKeywords.length > 0
      ? missingKeywords.join(', ')
      : 'None specified';

    const systemPrompt = `You are an elite Executive Career Coach and ATS (Applicant Tracking System) Optimization Expert.
Your goal is to tailor and optimize the candidate's resume for the target job to achieve a 95%+ ATS match score.

INSTRUCTIONS:
1. Preserve the candidate's authentic background and facts, but rewrite and upgrade bullet points using strong action verbs (e.g., Engineered, Spearheaded, Architected, Accelerated, Reduced).
2. Quantify achievements with metrics, percentages, and data-driven impact where appropriate.
3. Naturally integrate these critical missing keywords: ${missingList}.
4. Organize the output cleanly in standard markdown with the following sections:
   - **PROFESSIONAL SUMMARY** (2-3 powerful sentences targeted at this role)
   - **CORE COMPETENCIES & TECHNICAL SKILLS** (categorized bullet points)
   - **PROFESSIONAL EXPERIENCE** (optimized bullet points highlighting relevant tools & metrics)
   - **EDUCATION & CERTIFICATIONS**
5. Do NOT output conversational filler or preamble. Start directly with the markdown formatted resume.`;

    const userPrompt = `TARGET JOB TITLE: ${jobTitle || 'Technical Role'}
TARGET JOB DESCRIPTION:
${jobDescription || jobTitle}

CANDIDATE CURRENT RESUME:
${resumeText}`;

    // List of Google AI models to attempt in streaming mode
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-flash-lite-latest",
      "gemini-pro-latest"
    ];

    let geminiResponse: Response | null = null;
    let successfulModel = "";

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 3000
            }
          })
        });

        if (res.ok && res.body) {
          geminiResponse = res;
          successfulModel = model;
          break;
        }
      } catch (e) {
        // Fallback to next model
      }
    }

    if (!geminiResponse || !geminiResponse.body) {
      return new Response(JSON.stringify({ error: "AI optimization service is busy. Please try again in a moment." }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Transform SSE stream from Google AI into a clean text stream for the browser
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr && dataStr !== '[DONE]') {
              try {
                const parsed = JSON.parse(dataStr);
                const candidates = parsed.candidates || [];
                for (const candidate of candidates) {
                  const parts = candidate.content?.parts || [];
                  for (const part of parts) {
                    if (part.text) {
                      controller.enqueue(encoder.encode(part.text));
                    }
                  }
                }
              } catch (err) {
                // Ignore parse errors on partial JSON chunks
              }
            }
          }
        }
      }
    });

    const readable = geminiResponse.body.pipeThrough(transformStream);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Model-Used': successfulModel
      }
    });

  } catch (err: any) {
    console.error("Optimize Resume Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to optimize resume" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
