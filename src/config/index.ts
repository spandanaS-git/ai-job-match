export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Zero-Cost Zivo.AI',
    description: 'An AI-powered job matcher platform that runs at zero cost.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
};
