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

    // 2. Fetch ALL jobs (bypassing the 1000 row limit by paginating)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 60)
    
    let allJobs: any[] = []
    let hasMore = true
    let page = 0
    const pageSize = 1000
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company, experience_required, url, created_at, posted_at')
        .gte('posted_at', cutoffDate.toISOString())
        .order('posted_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)
        
      if (error) throw error
      
      if (data && data.length > 0) {
        allJobs = [...allJobs, ...data]
        page++
      } else {
        hasMore = false
      }
      
      // Failsafe to prevent infinite loops (cap at 10,000 jobs max)
      if (allJobs.length >= 10000) {
        hasMore = false
      }
    }
    
    const uniqueCompanies = new Set(allJobs.map(j => j.company)).size
    
    return { success: true, jobs: allJobs, totalJobs: totalJobsCount || allJobs.length, totalCompanies: uniqueCompanies }
  } catch (error: any) {
    console.error("Failed to fetch jobs:", error)
    return { success: false, error: error.message, jobs: [] }
  }
}
