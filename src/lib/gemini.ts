export async function getBestAvailableModel(): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) throw new Error("Failed to fetch models list");
    
    const data = await res.json();
    const models = data.models || [];
    
    const validModels = models.filter((m: any) => 
      m.supportedGenerationMethods && 
      m.supportedGenerationMethods.includes("generateContent")
    ).map((m: any) => m.name.replace("models/", ""));

    if (validModels.length === 0) {
      throw new Error("No text generation models available for this API key.");
    }

    const proModel = validModels.find((m: string) => m.includes("pro") && !m.includes("preview") && !m.includes("vision"));
    if (proModel) return proModel;

    const flashModel = validModels.find((m: string) => m.includes("flash") && !m.includes("preview") && !m.includes("vision"));
    if (flashModel) return flashModel;

    return validModels[0];
  } catch (err) {
    console.error("Error dynamically fetching models", err);
    return "gemini-pro-latest";
  }
}
