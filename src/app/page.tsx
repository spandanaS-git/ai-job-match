'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ExternalLink, Database, ChevronDown, Loader2, Search } from "lucide-react"
import { fetchLatestDataJobs } from "./actions"

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [totalJobsMetric, setTotalJobsMetric] = useState(0)
  const [totalCompaniesMetric, setTotalCompaniesMetric] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [expFilter, setExpFilter] = useState("all")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    async function loadJobs() {
      const res = await fetchLatestDataJobs()
      if (res.success) {
        setJobs(res.jobs)
        if (res.totalJobs) setTotalJobsMetric(res.totalJobs)
        if (res.totalCompanies) setTotalCompaniesMetric(res.totalCompanies)
      } else {
        setError(res.error)
      }
      setLoading(false)
    }
    loadJobs()
  }, [])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const calculateDaysAgo = (dateString: string) => {
    if (!dateString) return "Unknown"
    const postedDate = new Date(dateString)
    const today = new Date()
    const diffTime = today.getTime() - postedDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return "Today"
    if (diffDays === 1) return "1 day ago"
    return `${diffDays} days ago`
  }

  const formatExactDate = (dateString: string) => {
    if (!dateString) return "Unknown Date"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Apply Experience & Time Filters
  const filteredJobs = jobs.filter(job => {
    // 1. Experience Filter
    const expReq = job.experience_required || "Not Specified"
    let expMatch = false
    
    if (expFilter === "all") {
      expMatch = true
    } else if (expFilter === "not_specified") {
      expMatch = expReq === "Not Specified"
    } else {
      const parsedYears = parseInt(expReq)
      if (isNaN(parsedYears)) {
        expMatch = false
      } else if (expFilter === "entry") {
        expMatch = parsedYears <= 2
      } else if (expFilter === "mid") {
        expMatch = parsedYears >= 3 && parsedYears <= 5
      } else if (expFilter === "senior") {
        expMatch = parsedYears >= 6
      }
    }
    
    if (!expMatch) return false
    
    // 2. Search Filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      const titleMatch = (job.title || "").toLowerCase().includes(query)
      const companyMatch = (job.company || "").toLowerCase().includes(query)
      if (!titleMatch && !companyMatch) return false
    }

    return true
  })


  // Calculate Paginated Jobs
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-blue-500/30">
      


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header and Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-bold tracking-tight mb-1 text-slate-100">
              Data / AI Roles
            </h1>
            {totalJobsMetric > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-sm text-slate-400 font-medium">
                  Tracking <span className="text-emerald-400 font-semibold">{totalJobsMetric.toLocaleString()}</span> active roles across <span className="text-white font-semibold">{totalCompaniesMetric}+</span> top tech companies
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            {/* Search Bar */}
            <div className="relative z-40">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search roles, companies..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-64 pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-slate-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-lg placeholder:text-slate-500"
              />
            </div>

            {/* Experience Filter Dropdown */}
            <div className="relative flex-shrink-0 z-50">
              <button 
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-64 px-4 py-3 bg-white/5 border border-white/10 text-slate-200 text-sm rounded-xl hover:bg-white/10 transition-colors shadow-lg"
              >
                {
                  {
                    'all': 'All Experience Levels',
                    'entry': 'Entry Level (0-2 years)',
                    'mid': 'Mid Level (3-5 years)',
                    'senior': 'Senior Level (6+ years)',
                    'not_specified': 'Not Specified'
                  }[expFilter]
                }
                <ChevronDown className={`size-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 w-full bg-[#151515] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 flex flex-col"
                  >
                    {[
                      { value: 'all', label: 'All Experience Levels' },
                      { value: 'entry', label: 'Entry Level (0-2 years)' },
                      { value: 'mid', label: 'Mid Level (3-5 years)' },
                      { value: 'senior', label: 'Senior Level (6+ years)' },
                      { value: 'not_specified', label: 'Not Specified' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setExpFilter(opt.value)
                          setIsDropdownOpen(false)
                          setCurrentPage(1)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          expFilter === opt.value 
                            ? 'bg-blue-500/20 text-blue-400 font-medium border-l-2 border-blue-500' 
                            : 'text-slate-300 hover:bg-white/5 border-l-2 border-transparent'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-8 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Role Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Company</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Experience Req</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Posted</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Apply</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="size-6 animate-spin text-blue-500" />
                        Fetching latest roles...
                      </div>
                    </td>
                  </tr>
                ) : currentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                      No Data/AI jobs found in the last 10 days.
                    </td>
                  </tr>
                ) : (
                  currentJobs.map((job, i) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      key={job.id} 
                      className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-white group-hover:text-blue-400 transition-colors">
                        {job.title}
                      </td>
                      <td className="px-6 py-4">
                        {job.company}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium border border-white/10">
                          {job.experience_required || "Not Specified"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-slate-200">
                            {formatExactDate(job.posted_at || job.created_at)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {calculateDaysAgo(job.posted_at || job.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <a 
                          href={job.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center size-8 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 border border-blue-500/30"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </main>
      
    </div>
  )
}
