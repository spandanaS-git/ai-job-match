import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function analyzeAtsLocally(resumeText: string, jobDescription: string) {
  const commonTechSkills = [
    "Python", "SQL", "R", "Java", "Scala", "C++", "C#", "Go", "Rust", "JavaScript", "TypeScript",
    "Pandas", "NumPy", "Scikit-Learn", "TensorFlow", "PyTorch", "Keras", "Spark", "PySpark", "Hadoop",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Airflow", "dbt", "Snowflake", "Databricks", "BigQuery",
    "Redshift", "PostgreSQL", "MySQL", "MongoDB", "Cassandra", "Redis", "Kafka", "Tableau", "PowerBI", "Looker",
    "Excel", "Git", "CI/CD", "Terraform", "MLOps", "NLP", "LLM", "Computer Vision", "Deep Learning",
    "Machine Learning", "Data Engineering", "Data Modeling", "Data Warehousing", "ETL", "ELT", "A/B Testing",
    "Statistics", "REST API", "GraphQL", "Agile", "Scrum", "Kubeflow", "MLflow", "FastAPI", "Flask", "Django"
  ];

  const resumeLower = (resumeText || '').toLowerCase();
  const jdLower = (jobDescription || '').toLowerCase();

  // Extract skills mentioned in JD
  const requiredInJd = commonTechSkills.filter(skill => {
    const pattern = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
    return pattern.test(jdLower);
  });

  const matchedSkills: string[] = [];
  const missingKeywords: string[] = [];

  requiredInJd.forEach(skill => {
    const pattern = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
    if (pattern.test(resumeLower)) {
      matchedSkills.push(skill);
    } else {
      missingKeywords.push(skill);
    }
  });

  let score = 50;
  if (requiredInJd.length > 0) {
    const keywordRatio = matchedSkills.length / requiredInJd.length;
    score = Math.min(95, Math.max(30, Math.round(keywordRatio * 100)));
  } else {
    // Word overlap fallback if no specific keywords matched
    const jdWords = Array.from(new Set(jdLower.match(/[a-z]{4,}/g) || []));
    const resumeWords = new Set(resumeLower.match(/[a-z]{4,}/g) || []);
    let matchCount = 0;
    jdWords.forEach(w => {
      if (resumeWords.has(w)) matchCount++;
    });
    const ratio = jdWords.length > 0 ? matchCount / jdWords.length : 0.6;
    score = Math.min(95, Math.max(35, Math.round(ratio * 120)));
  }

  const status = score >= 85 ? "Perfect Match" : score >= 65 ? "Strong Match" : "Needs Improvement";

  return {
    score,
    status,
    missingKeywords: missingKeywords.slice(0, 6)
  };
}

export async function POST(req: Request) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: "Missing resumeText or jobDescription" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If valid Gemini API key is present, try Gemini AI
    if (apiKey && apiKey.length > 10) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const prompt = `
          You are an expert technical recruiter and ATS (Applicant Tracking System) algorithm.
          Compare the following Resume to the Job Description.

          Job Description:
          ${jobDescription}

          Resume:
          ${resumeText}

          Provide a strict JSON response with the following format. Do not use markdown wrappers like \`\`\`json. Just pure JSON.
          {
            "score": 85,
            "status": "Perfect Match",
            "missingKeywords": ["Python", "AWS"]
          }
        `;

        const modelsToTry = [
          "gemini-2.5-flash",
          "gemini-flash-latest",
          "gemini-3.5-flash",
          "gemini-flash-lite-latest",
          "gemini-pro-latest"
        ];

        let responseText = "";

        for (const modelName of modelsToTry) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            responseText = result.response.text();
            if (responseText) break;
          } catch (err) {
            // Try next model
          }
        }

        if (responseText) {
          const cleanJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsedData = JSON.parse(cleanJsonString);
          return NextResponse.json(parsedData);
        }
      } catch (aiErr) {
        console.warn("Gemini AI attempt failed, using ATS matcher fallback:", aiErr);
      }
    }

    // 2. High-speed, 100% resilient ATS Keyword Matcher
    const localResult = analyzeAtsLocally(resumeText, jobDescription);
    return NextResponse.json(localResult);

  } catch (error: any) {
    console.error("AI Match Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze resume" }, { status: 500 });
  }
}
