import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SKILL_DICTIONARY: Record<string, string[]> = {
  // Languages & Core Data Tech
  "Python": ["python", "py"],
  "SQL": ["sql", "tsql", "plsql", "postgresql", "postgres", "mysql", "sqlite"],
  "R": ["\\br\\b", "r programming", "r-project"],
  "Java": ["java"],
  "Scala": ["scala"],
  "C++": ["c\\+\\+"],
  "TypeScript": ["typescript", "ts"],
  "JavaScript": ["javascript", "js"],

  // Data & BI Tools
  "Tableau": ["tableau"],
  "Power BI": ["power bi", "powerbi", "dax"],
  "Looker": ["looker", "lookml"],
  "Excel": ["excel", "spreadsheets", "vlookup"],
  "Data Modeling": ["data modeling", "data model", "star schema", "dimensional modeling", "relational modeling"],
  "Data Warehousing": ["data warehouse", "data warehousing", "dwh", "marts"],
  "Data Pipelines": ["data pipeline", "data pipelines", "pipeline development"],
  "ETL / ELT": ["etl", "elt", "data extraction", "data transformation", "data ingestion"],
  "A/B Testing": ["a/b testing", "ab testing", "experimentation", "hypothesis testing", "causal inference"],
  "Statistics": ["statistics", "statistical analysis", "hypothesis test", "statistical modeling", "probability"],

  // Big Data & Cloud Platforms
  "Snowflake": ["snowflake"],
  "Databricks": ["databricks"],
  "Spark": ["spark", "pyspark", "apache spark"],
  "Hadoop": ["hadoop", "hive"],
  "Kafka": ["kafka", "event streaming", "pubsub"],
  "Airflow": ["airflow", "apache airflow"],
  "dbt": ["\\bdbt\\b", "data build tool"],
  "AWS": ["aws", "amazon web services", "s3", "ec2", "redshift", "athena", "glue", "emr", "lambda"],
  "GCP": ["gcp", "google cloud", "bigquery", "dataflow", "dataproc"],
  "Azure": ["azure", "synapse", "azure data factory", "adls", "fabric"],
  "Docker": ["docker", "containerization", "containers"],
  "Kubernetes": ["kubernetes", "k8s"],
  "Terraform": ["terraform", "iac"],

  // AI & Machine Learning
  "Machine Learning": ["machine learning", "\\bml\\b", "predictive modeling", "supervised learning"],
  "Deep Learning": ["deep learning", "neural networks", "cnn", "rnn", "transformers"],
  "LLMs / Generative AI": ["llm", "llms", "large language model", "generative ai", "genai", "rag", "langchain", "prompt engineering"],
  "NLP": ["nlp", "natural language processing", "text mining", "spacy", "nltk", "huggingface"],
  "Computer Vision": ["computer vision", "opencv", "yolo", "object detection"],
  "PyTorch": ["pytorch"],
  "TensorFlow": ["tensorflow", "keras"],
  "Scikit-Learn": ["scikit-learn", "sklearn"],
  "Pandas": ["pandas"],
  "NumPy": ["numpy"],
  "MLOps": ["mlops", "mlflow", "kubeflow", "model deployment", "model monitoring"],

  // Databases
  "PostgreSQL": ["postgresql", "postgres"],
  "MongoDB": ["mongodb", "nosql"],
  "Redis": ["redis"],
  "Vector DB": ["pinecone", "weaviate", "chroma", "qdrant", "milvus", "vector database", "vector embeddings"],

  // Practices & APIs
  "Git / Version Control": ["git", "github", "gitlab", "version control"],
  "CI/CD": ["ci/cd", "continuous integration", "jenkins", "github actions"],
  "REST APIs": ["rest api", "restful", "fastapi", "flask", "django", "graphql"],
  "Agile / Scrum": ["agile", "scrum", "kanban", "sprints"]
};

const ROLE_BASELINES: Record<string, string[]> = {
  "analyst": ["SQL", "Python", "Tableau", "Power BI", "Excel", "Data Modeling", "A/B Testing", "Statistics"],
  "scientist": ["Python", "SQL", "Machine Learning", "Scikit-Learn", "Statistics", "PyTorch", "Pandas", "A/B Testing"],
  "engineer": ["Python", "SQL", "Spark", "AWS", "Data Pipelines", "ETL / ELT", "Docker", "Snowflake", "Airflow"],
  "learning": ["Python", "PyTorch", "TensorFlow", "Machine Learning", "Deep Learning", "MLOps", "NLP", "Docker"],
  "ai": ["Python", "LLMs / Generative AI", "PyTorch", "Machine Learning", "NLP", "Vector DB", "Docker"]
};

function analyzeAtsLocally(resumeText: string, jobDescription: string, jobTitle?: string) {
  const resumeLower = (resumeText || '').toLowerCase();
  const jdCombined = `${jobDescription || ''} ${jobTitle || ''}`.toLowerCase();

  const requiredSkills: string[] = [];

  // Match all skills present in JD
  for (const [skillName, patterns] of Object.entries(SKILL_DICTIONARY)) {
    for (const pattern of patterns) {
      const reg = new RegExp(`\\b${pattern}\\b`, 'i');
      if (reg.test(jdCombined)) {
        requiredSkills.push(skillName);
        break;
      }
    }
  }

  // If JD is short or no specific dictionary skills matched, infer from role title
  if (requiredSkills.length < 3) {
    for (const [roleKey, defaultSkills] of Object.entries(ROLE_BASELINES)) {
      if (jdCombined.includes(roleKey)) {
        defaultSkills.forEach(s => {
          if (!requiredSkills.includes(s)) requiredSkills.push(s);
        });
        break;
      }
    }
    // Fallback baseline if still empty
    if (requiredSkills.length === 0) {
      requiredSkills.push("SQL", "Python", "Data Modeling", "Excel", "Tableau", "Statistics");
    }
  }

  const matchedSkills: string[] = [];
  const missingKeywords: string[] = [];

  for (const skill of requiredSkills) {
    const patterns = SKILL_DICTIONARY[skill] || [skill.toLowerCase()];
    const hasSkill = patterns.some(p => {
      const reg = new RegExp(`\\b${p}\\b`, 'i');
      return reg.test(resumeLower);
    });

    if (hasSkill) {
      matchedSkills.push(skill);
    } else {
      missingKeywords.push(skill);
    }
  }

  const keywordRatio = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0.5;
  const score = Math.min(95, Math.max(30, Math.round(keywordRatio * 100)));
  const status = score >= 85 ? "Perfect Match" : score >= 65 ? "Strong Match" : "Needs Improvement";

  return {
    score,
    status,
    missingKeywords: missingKeywords.slice(0, 6)
  };
}

export async function POST(req: Request) {
  try {
    const { resumeText, jobDescription, jobTitle } = await req.json();

    if (!resumeText || (!jobDescription && !jobTitle)) {
      return NextResponse.json({ error: "Missing resumeText or job details" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If valid Gemini API key is present, try Gemini AI
    if (apiKey && apiKey.length > 10) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const prompt = `
          You are an expert technical recruiter and ATS (Applicant Tracking System) algorithm.
          Compare the following Resume to the Job Description.

          Job Title: ${jobTitle || ''}
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
          if (parsedData && typeof parsedData.score === 'number') {
            return NextResponse.json(parsedData);
          }
        }
      } catch (aiErr) {
        console.warn("Gemini AI attempt failed, using ATS matcher fallback:", aiErr);
      }
    }

    // 2. High-speed, 100% resilient ATS Keyword Matcher
    const localResult = analyzeAtsLocally(resumeText, jobDescription, jobTitle);
    return NextResponse.json(localResult);

  } catch (error: any) {
    console.error("AI Match Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze resume" }, { status: 500 });
  }
}
