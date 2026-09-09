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
        setError(res.error || "Failed to load jobs.")
      }
      setLoading(false)
    }
    loadJobs()
  }, [])

  const filteredJobs = jobs.filter(job => {
    const query = searchQuery.toLowerCase()
    const titleMatch = (job.title || "").toLowerCase().includes(query)
    const companyMatch = (job.company || "").toLowerCase().includes(query)
    
    if (searchQuery && !titleMatch && !companyMatch) return false
    
    if (expFilter !== 'all') {
      const expStr = (job.experience_required || "not specified").toLowerCase();
      
      if (expFilter === 'not_specified' && expStr !== 'not specified') return false;
      if (expFilter !== 'not_specified' && expStr === 'not specified') return false;

      const match = expStr.match(/(\d+)/);
      if (match) {
        const years = parseInt(match[1], 10);
        if (expFilter === 'entry' && years > 2) return false;
        if (expFilter === 'mid' && (years < 3 || years > 5)) return false;
        if (expFilter === 'senior' && years < 6) return false;
      } else {
        if (expFilter !== 'not_specified') return false;
      }
    }
    return true
  })

  const uniqueJobsMap = new Map();
  filteredJobs.forEach(job => {
    const key = `${job.title}-${job.company}`.toLowerCase();
    if (!uniqueJobsMap.has(key)) uniqueJobsMap.set(key, job);
  });
  const uniqueJobs = Array.from(uniqueJobsMap.values());

  const totalPages = Math.ceil(uniqueJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentJobs = uniqueJobs.slice(startIndex, startIndex + itemsPerPage)

  const formatExactDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  const calculateDaysAgo = (dateString: string) => {
    if (!dateString) return ""
    const diffTime = new Date().getTime() - new Date(dateString).getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "1 day ago"
    return `${diffDays} days ago`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 relative overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/30 blur-[120px]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-900/20 blur-[100px]" />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Hero Header */}
        <div className="flex flex-col items-center justify-center text-center mb-16 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live Updates
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-sm pb-2"
          >
            Data & AI Roles
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl"
          >
            Discover the latest technical roles in Machine Learning, Artificial Intelligence, and Data Science curated for top talent in the United States.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-8 mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-2xl"
          >
            <div className="flex flex-col items-center px-4">
              <span className="text-white text-3xl font-black tabular-nums">{totalJobsMetric || "..."}</span>
              <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-1">Active Jobs</span>
            </div>
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
            <div className="flex flex-col items-center px-4">
              <span className="text-white text-3xl font-black tabular-nums">{totalCompaniesMetric || "..."}</span>
              <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-1">Companies</span>
            </div>
          </motion.div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {["Analyst", "Data Scientist", "Data Engineer", "Machine Learning", "AI", "Intern"].map(tag => (
            <button
              key={tag}
              onClick={() => { setSearchQuery(tag); setCurrentPage(1); }}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all shadow-lg"
            >
              {tag}
            </button>
          ))}
          <button
              onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-all shadow-lg"
            >
              Clear
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10" />
            <input 
              type="text" 
              placeholder="Search by job title, or click a company logo..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="relative z-10 w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-xl text-lg"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="relative w-full md:w-56 z-20">
              <button 
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full h-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-4 flex items-center justify-between text-sm text-slate-300 hover:bg-white/10 transition-colors shadow-xl"
              >
                <span>
                  {expFilter === 'all' ? 'Experience: All' : 
                   expFilter === 'entry' ? 'Entry Level' : 
                   expFilter === 'mid' ? 'Mid Level' : 
                   expFilter === 'senior' ? 'Senior Level' : 'Not Specified'}
                </span>
                <ChevronDown className="size-4 text-slate-500" />
              </button>
              
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-20 top-full mt-2 w-full bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden backdrop-blur-xl"
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
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
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
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-6 py-4"><div className="h-5 bg-white/5 rounded animate-pulse w-3/4"></div></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white/5 animate-pulse"></div>
                          <div className="h-4 bg-white/5 rounded animate-pulse w-24"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-6 bg-white/5 rounded-full animate-pulse w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded animate-pulse w-16 ml-auto mt-1"></div></td>
                      <td className="px-6 py-4"><div className="size-8 rounded-full bg-white/5 animate-pulse mx-auto"></div></td>
                    </tr>
                  ))
                ) : currentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                      No Data/AI jobs found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  currentJobs.map((job, i) => {
                    const jobDate = job.posted_at || job.created_at;
                    const diffTime = new Date().getTime() - new Date(jobDate).getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      key={job.id} 
                      className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-white group-hover:text-blue-400 transition-colors">
                        <div className="flex items-center gap-2">
                          {job.title}
                          {diffDays <= 1 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">NEW</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1 -ml-1 rounded transition-colors"
                          onClick={() => setSearchQuery(job.company)}
                          title={`Click to see all ${job.company} jobs`}
                        >
                          <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center p-1 overflow-hidden shrink-0">
                            <img 
                              src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`} 
                              alt={job.company}
                              className="w-full h-full object-contain"
                              onError={(e) => { 
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-bold text-slate-800">${job.company.charAt(0)}</span>`;
                              }}
                            />
                          </div>
                          <span className="font-medium text-slate-200">{job.company}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium border border-white/10 shadow-sm">
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
                          className="inline-flex items-center justify-center size-8 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 border border-blue-500/30 shadow-lg"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </td>
                    </motion.tr>
                  )
                })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Advanced Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 mb-12 gap-2 sm:gap-4">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-lg text-slate-300 disabled:opacity-30 hover:bg-white/10 transition-colors flex items-center justify-center shadow-lg"
            >
              &laquo;
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-lg text-slate-300 disabled:opacity-30 hover:bg-white/10 transition-colors shadow-lg"
            >
              Previous
            </button>
            <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-lg shadow-lg">
              <span className="text-slate-400 text-sm font-medium">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= totalPages) {
                    setCurrentPage(val);
                  }
                }}
                className="w-12 bg-white/5 border border-white/10 rounded px-1 py-1 text-center text-slate-200 text-sm focus:outline-none focus:border-blue-500/50 appearance-none"
              />
              <span className="text-slate-400 text-sm font-medium">of {totalPages}</span>
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-lg text-slate-300 disabled:opacity-30 hover:bg-white/10 transition-colors shadow-lg"
            >
              Next
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-lg text-slate-300 disabled:opacity-30 hover:bg-white/10 transition-colors flex items-center justify-center shadow-lg"
            >
              &raquo;
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
