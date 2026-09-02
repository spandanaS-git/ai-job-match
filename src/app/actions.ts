'use server'

import { createClient } from '@supabase/supabase-js'

export async function fetchLatestDataJobs() {
  try {
    // We use the service role key since we removed the authenticated user requirement,
    // and the original RLS policy on the jobs table blocked anonymous users.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Fetch jobs posted in the last 60 days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 60)
    
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, company, experience_required, url, created_at, posted_at')
      .gte('posted_at', cutoffDate.toISOString())
      .order('posted_at', { ascending: false })
      .limit(10000)
      
    if (error) throw error
    
    return { success: true, jobs: jobs || [] }
  } catch (error: any) {
    console.error("Failed to fetch jobs:", error)
    return { success: false, error: error.message, jobs: [] }
  }
}
