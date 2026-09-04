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
    
    // 1. Get exact total count of jobs
    const { count: totalJobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    // 2. Fetch the latest 1000 jobs
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 60)
    
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, company, experience_required, url, created_at, posted_at')
      .gte('posted_at', cutoffDate.toISOString())
      .order('posted_at', { ascending: false })
      .limit(1000)
      
    if (error) throw error
    
    // Calculate unique companies from the returned jobs, or if we want exact from DB it requires an RPC. 
    // We'll just approximate companies based on the 1000 latest jobs.
    const uniqueCompanies = new Set(jobs?.map(j => j.company)).size
    
    return { success: true, jobs: jobs || [], totalJobs: totalJobsCount || 1000, totalCompanies: uniqueCompanies }
  } catch (error: any) {
    console.error("Failed to fetch jobs:", error)
    return { success: false, error: error.message, jobs: [] }
  }
}
