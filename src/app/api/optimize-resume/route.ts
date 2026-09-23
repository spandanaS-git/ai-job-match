import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function generateSmartTailoredResume(resumeText: string, jobTitle: string, jobDescription: string, missingKeywords: string[]): string {
  const roleName = jobTitle || "Target Role";
  const missingList = Array.isArray(missingKeywords) 
    ? missingKeywords.filter(k => k && k.trim().length > 0)
    : [];

  if (!resumeText || resumeText.trim().length === 0) {
    return `# Candidate Resume\n**Target Role:** ${roleName}\n\n* Please upload your resume to generate an optimized version.`;
  }

  const rawLines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const phrasingTemplates = [
    (kw: string) => `, leveraging **${kw}** methodologies to enhance efficiency and data integrity.`,
    (kw: string) => `, utilizing **${kw}** workflows to streamline project delivery and cross-functional alignment.`,
    (kw: string) => `, incorporating **${kw}** standards to ensure quality compliance and accuracy.`,
    (kw: string) => `, applying **${kw}** frameworks to drive measurable operational performance.`,
    (kw: string) => `, aligning execution with **${kw}** best practices to optimize key outcomes.`
  ];

  const sectionKeywords = {
    summary: ['summary', 'profile', 'about', 'objective', 'overview'],
    skills: ['skills', 'technologies', 'competencies', 'technical skills', 'tools', 'proficiencies'],
    experience: ['experience', 'work experience', 'employment', 'work history', 'professional experience', 'projects', 'research'],
    education: ['education', 'academic', 'degrees', 'certifications', 'qualifications']
  };

  const keywordsForExp = [...missingList];
  let templateIndex = 0;
  let currentSection = 'header';
  let formattedLines: string[] = [];
  let skillsInjected = false;
  let bulletIndex = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lower = line.toLowerCase();

    // Detect section heading
    const isHeading = (
      (line.startsWith('#') || line.toUpperCase() === line || line.endsWith(':')) &&
      line.length < 45 &&
      !line.startsWith('*') && !line.startsWith('-') && !line.startsWith('•')
    );

    let detectedSection: string | null = null;
    if (isHeading) {
      for (const [sec, terms] of Object.entries(sectionKeywords)) {
        if (terms.some(t => lower.includes(t))) {
          detectedSection = sec;
          break;
        }
      }
    }

    if (detectedSection) {
      if (currentSection === 'skills' && !skillsInjected && missingList.length > 0) {
        formattedLines.push(`* **ATS Optimized Competencies:** ${missingList.map(k => `**${k}**`).join(', ')}`);
        skillsInjected = true;
      }
      currentSection = detectedSection;
      const cleanHeader = line.replace(/^#+\s*/, '').replace(/:$/, '').trim();
      formattedLines.push(`\n### ${cleanHeader.toUpperCase()}\n`);
      continue;
    }

    // Skills section
    if (currentSection === 'skills') {
      const isBullet = line.startsWith('*') || line.startsWith('-') || line.startsWith('•');
      formattedLines.push(isBullet ? `* ${line.replace(/^[*•-]\s*/, '')}` : line);
      continue;
    }

    // Experience / Projects / Research section
    if (currentSection === 'experience') {
      const isBullet = line.startsWith('*') || line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./);
      if (isBullet) {
        let text = line.replace(/^[*•-]\s*|\d+\.\s*/, '').trim();
        if (keywordsForExp.length > 0 && bulletIndex % 2 === 0) {
          const kw = keywordsForExp.shift()!;
          if (!text.toLowerCase().includes(kw.toLowerCase())) {
            const template = phrasingTemplates[templateIndex % phrasingTemplates.length];
            templateIndex++;
            text = text.replace(/[.;,]+$/, '') + template(kw);
          }
        }
        bulletIndex++;
        formattedLines.push(`* ${text}`);
      } else {
        if (line.length < 90 && (line.includes('|') || line.includes('–') || line.includes('-') || line.match(/\b(20\d\d|19\d\d|present)\b/i))) {
          formattedLines.push(`\n#### ${line.replace(/^#+\s*/, '')}\n`);
        } else {
          formattedLines.push(line);
        }
      }
      continue;
    }

    // Summary section
    if (currentSection === 'summary') {
      if (line.length > 20 && keywordsForExp.length > 0 && !line.includes('**')) {
        const topKw = keywordsForExp.shift()!;
        formattedLines.push(`${line.replace(/[.;,]+$/, '')}, with targeted proficiency in **${topKw}**.`);
      } else {
        formattedLines.push(line);
      }
      continue;
    }

    // Header / General
    if (i === 0 && line.length < 60) {
      formattedLines.push(`# ${line.replace(/^#+\s*/, '')}`);
      formattedLines.push(`**Target Role Alignment:** ${roleName} | **ATS Keyword Optimized**\n---`);
    } else {
      formattedLines.push(line);
    }
  }

  if (!skillsInjected && missingList.length > 0) {
    formattedLines.push(`\n### ATS KEYWORDS & CORE COMPETENCIES\n* **Targeted Job Keywords:** ${missingList.map(k => `**${k}**`).join(', ')}\n`);
  }

  return formattedLines.join('\n');
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  let reqData: any = {};
  
  try {
    reqData = await req.json();
  } catch (e) {
    reqData = {};
  }

  const resumeText = reqData.resumeText || "";
  const jobTitle = reqData.jobTitle || "Technical Role";
  const jobDescription = reqData.jobDescription || jobTitle;
  const missingKeywords = reqData.missingKeywords || [];

  try {
    const apiKey = process.env.GEMINI_API_KEY;
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
   - **# [Candidate Name]**
   - **PROFESSIONAL SUMMARY** (2-3 powerful sentences targeted at this role)
   - **CORE COMPETENCIES & TECHNICAL SKILLS** (categorized bullet points)
   - **PROFESSIONAL EXPERIENCE** (optimized bullet points highlighting relevant tools & metrics)
   - **EDUCATION & CERTIFICATIONS**
5. Do NOT output conversational filler or preamble. Start directly with the markdown formatted resume.`;

    const userPrompt = `TARGET JOB TITLE: ${jobTitle}
TARGET JOB DESCRIPTION:
${jobDescription}

CANDIDATE CURRENT RESUME:
${resumeText || 'Candidate with relevant technical background'}`;

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

    if (apiKey && apiKey.length > 10) {
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
                maxOutputTokens: 4096
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
    }

    // 1. If Gemini AI stream succeeded, pipe it through the buffered SSE transformer
    if (geminiResponse && geminiResponse.body) {
      const decoder = new TextDecoder();
      let sseBuffer = '';

      const transformStream = new TransformStream({
        transform(chunk, controller) {
          sseBuffer += decoder.decode(chunk, { stream: true });
          const events = sseBuffer.split('\n\n');
          sseBuffer = events.pop() || '';

          for (const event of events) {
            const lines = event.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const dataStr = trimmed.slice(5).trim();
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
                    // Partial JSON ignore
                  }
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
    }
  } catch (err) {
    console.error("Gemini optimization error, falling back:", err);
  }

  // 2. High-speed resilient streaming fallback (guarantees 100% uptime with word-by-word streaming)
  const fallbackText = generateSmartTailoredResume(
    resumeText,
    jobTitle,
    jobDescription,
    missingKeywords
  );

  const stream = new ReadableStream({
    async start(controller) {
      const words = fallbackText.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        controller.enqueue(encoder.encode(chunk));
        // Provide subtle streaming cadence
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Model-Used': 'ats-smart-optimizer'
    }
  });
}
