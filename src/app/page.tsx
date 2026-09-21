'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ExternalLink, Database, ChevronDown, Loader2, Search, Sparkles, FileText, X, CheckCircle, AlertCircle, Plus } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
import { fetchLatestDataJobs } from "./actions"

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [totalJobsMetric, setTotalJobsMetric] = useState(0)
  const [totalCompaniesMetric, setTotalCompaniesMetric] = useState(0)
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false)
  
  // Add Job Form State
  const [addJobUrl, setAddJobUrl] = useState('')
  const [addJobTitle, setAddJobTitle] = useState('')
  const [addJobCompany, setAddJobCompany] = useState('')
  const [addJobExp, setAddJobExp] = useState('')
  const [addJobLocation, setAddJobLocation] = useState('Remote')
  const [addJobPostedDate, setAddJobPostedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isVerifyingJob, setIsVerifyingJob] = useState(false)
  const [isSavingJob, setIsSavingJob] = useState(false)
  const [addJobError, setAddJobError] = useState('')

  const [searchQuery, setSearchQuery] = useState("")
  const [expFilter, setExpFilter] = useState("all")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  
  const [currentPage, setCurrentPage] = useState(1)
  
  // AI Matcher State
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [resumeText, setResumeText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [matchResult, setMatchResult] = useState<any>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + " ";
        }
        setResumeText(fullText);
      } catch (err) {
        console.error("PDF Parsing Error", err);
        alert("Failed to parse PDF. Please try a different file.");
      }
    } else {
      // Text or other formats
      const text = await file.text();
      setResumeText(text);
    }
  };


  const verifyJobUrl = async () => {
    if (!addJobUrl) return
    setIsVerifyingJob(true)
    setAddJobError('')
    try {
      const res = await fetch('/api/verify-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: addJobUrl })
      })
      const data = await res.json()
      if (res.ok) {
        if (data.title) setAddJobTitle(data.title)
        if (data.company) setAddJobCompany(data.company)
                if (data.experience) setAddJobExp(data.experience)
        if (data.postedDate) {
          const d = new Date(data.postedDate)
          if (!isNaN(d.getTime())) {
            setAddJobPostedDate(d.toISOString().split('T')[0])
          }
        }
      } else {
        setAddJobError(data.error || 'Failed to auto-fill. Please enter manually.')
      }
    } catch (err: any) {
      setAddJobError('Failed to verify URL. Please fill details manually.')
    }
    setIsVerifyingJob(false)
  }

  const saveManualJob = async () => {
    if (!addJobUrl || !addJobTitle || !addJobCompany) {
      setAddJobError('URL, Title, and Company are required')
      return
    }
    setIsSavingJob(true)
    setAddJobError('')
    try {
      const res = await fetch('/api/add-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: addJobUrl,
          title: addJobTitle,
          company: addJobCompany,
          experience_required: addJobExp,
          location: addJobLocation,
          posted_at: addJobPostedDate
        })
      })
      const data = await res.json()
      if (res.ok && data.job) {
        setJobs([data.job, ...jobs])
        setIsAddJobModalOpen(false)
        setAddJobUrl('')
        setAddJobTitle('')
        setAddJobCompany('')
        setAddJobExp('')
        setAddJobLocation('Remote')
      } else {
        setAddJobError(data.error || 'Failed to save job')
      }
    } catch (err: any) {
      setAddJobError('Failed to save job')
    }
    setIsSavingJob(false)
  }

  const analyzeMatch = async () => {
    if (!resumeText || !selectedJob) return;
    setIsAnalyzing(true);
    setMatchResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText,
          jobDescription: selectedJob.description || selectedJob.title
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMatchResult(data);
    } catch (err: any) {
      alert("Analysis failed: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      } else if (expStr !== 'not specified') {
        if (expFilter === 'entry' && !expStr.includes('entry') && !expStr.includes('junior')) return false;
        if (expFilter === 'mid' && !expStr.includes('mid') && !expStr.includes('intermediate')) return false;
        if (expFilter === 'senior' && !expStr.includes('senior') && !expStr.includes('lead') && !expStr.includes('principal') && !expStr.includes('staff')) return false;
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
              <span className="text-white text-3xl font-black tabular-nums">{uniqueJobs.length || "0"}</span>
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
            <button
              onClick={() => setIsAddJobModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg text-sm"
            >
              <Plus className="size-5" />
              <span className="hidden md:inline">Add Job</span>
            </button>
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

        {/* Mobile Cards View */}
        <div className="grid grid-cols-1 gap-4 md:hidden mb-8">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-lg animate-pulse">
                <div className="flex gap-4 items-start mb-4">
                  <div className="w-12 h-12 rounded bg-white/5 shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-white/5 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-white/5 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-6 bg-white/5 rounded-full w-24 mb-4"></div>
                <div className="flex justify-between items-end">
                  <div className="h-4 bg-white/5 rounded w-16"></div>
                  <div className="h-8 w-24 rounded-lg bg-white/5"></div>
                </div>
              </div>
            ))
          ) : currentJobs.length === 0 ? (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center text-slate-500 shadow-lg">
              No Data/AI jobs found. Try adjusting your filters.
            </div>
          ) : (
            currentJobs.map((job, i) => {
              const jobDate = job.posted_at || job.created_at;
              const diffTime = new Date().getTime() - new Date(jobDate).getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={job.id} 
                  className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-lg flex flex-col"
                >
                  <div className="flex gap-4 items-start mb-3">
                    <div 
                      className="w-12 h-12 rounded-md bg-white flex items-center justify-center p-1.5 overflow-hidden shrink-0 cursor-pointer shadow-sm"
                      onClick={() => setSearchQuery(job.company)}
                      title={`Click to see all ${job.company} jobs`}
                    >
                      <img 
                        src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`} 
                        alt={job.company}
                        className="w-full h-full object-contain"
                        onError={(e) => { 
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `<span class="text-sm font-bold text-slate-800">${job.company.charAt(0)}</span>`;
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-base leading-tight mb-1">
                        {job.title}
                        {diffDays <= 1 && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 align-middle">NEW</span>
                        )}
                      </h3>
                      <div 
                        className="font-medium text-slate-400 text-sm cursor-pointer hover:text-blue-400 transition-colors inline-block"
                        onClick={() => setSearchQuery(job.company)}
                      >
                        {job.company}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-medium border border-white/10 shadow-sm text-slate-300">
                      {job.experience_required || "Not Specified"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-auto pt-3 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-300">
                        {formatExactDate(job.posted_at || job.created_at)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {calculateDaysAgo(job.posted_at || job.created_at)}
                      </span>
                    </div>
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 font-medium text-sm hover:bg-blue-600 hover:text-white transition-all border border-blue-500/30 shadow-lg"
                    >
                      Apply <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Desktop Data Table */}
        <div className="hidden md:block bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] mb-8">
<div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Role Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Company</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Experience Req</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Posted</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
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
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => { setSelectedJob(job); setIsMatchModalOpen(true); setMatchResult(null); setResumeText(""); }}
                            title="Check Score"
                            className="inline-flex items-center justify-center size-8 rounded-full bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all hover:scale-110 border border-indigo-500/30 shadow-lg"
                          >
                            <Sparkles className="size-4" />
                          </button>
                          <a 
                            href={job.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center size-8 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 border border-blue-500/30 shadow-lg"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </div>
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

      {/* AI Match Modal */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="size-5 text-indigo-400" /> Check Score
              </h3>
              <button onClick={() => setIsMatchModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              <div>
                <p className="text-sm text-slate-400">Target Role</p>
                <p className="text-white font-medium flex justify-between items-center">
                  <span>{selectedJob?.title} @ {selectedJob?.company}</span>
                </p>
                
                                  <a 
                    href={selectedJob?.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-md border border-indigo-500/20 w-fit"
                  >
                    Read Full Job Description <ExternalLink className="size-3" />
                  </a>
              </div>

              {!matchResult && !isAnalyzing && (
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-white/[0.01] hover:bg-white/[0.03] transition-colors relative">
                  <input 
                    type="file" 
                    accept=".pdf,.txt" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileText className="size-10 text-slate-500 mb-3" />
                  <p className="text-slate-300 font-medium mb-1">
                    {resumeText ? "Resume loaded successfully!" : "Drop your resume here or click to browse"}
                  </p>
                  <p className="text-xs text-slate-500">Supports PDF & TXT (Max 5MB)</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="size-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4"></div>
                  <p className="text-indigo-400 font-medium animate-pulse">Our AI is reading your resume...</p>
                </div>
              )}

              {matchResult && (
                <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                  <div className="relative size-32 flex items-center justify-center">
                    <svg className="absolute inset-0 size-full -rotate-90">
                      <circle cx="64" cy="64" r="56" className="fill-none stroke-white/10 stroke-[8]" />
                      <circle 
                        cx="64" cy="64" r="56" 
                        className={`fill-none stroke-[8] stroke-linecap-round transition-all duration-1000 ${matchResult.score > 85 ? 'stroke-emerald-500' : matchResult.score > 65 ? 'stroke-amber-500' : 'stroke-red-500'}`}
                        strokeDasharray="351.8"
                        strokeDashoffset={351.8 - (351.8 * matchResult.score) / 100}
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-black text-white">{matchResult.score}%</span>
                    </div>
                  </div>
                  
                  <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${matchResult.score > 85 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {matchResult.score > 85 ? <CheckCircle className="size-4" /> : <AlertCircle className="size-4" />}
                    {matchResult.status}
                  </div>

                  {matchResult.missingKeywords && matchResult.missingKeywords.length > 0 && (
                    <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-sm font-medium text-slate-300 mb-3">Critical Missing Keywords:</p>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.missingKeywords.map((kw: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-xs font-medium">
                            + {kw}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-3">Add these keywords to your resume to beat the ATS filter.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3">
              <button 
                onClick={() => setIsMatchModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Close
              </button>
              {!matchResult && !isAnalyzing && (
                <button 
                  onClick={analyzeMatch}
                  disabled={!resumeText}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Sparkles className="size-4" /> Analyze
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
      {/* Add Job Modal */}
      {isAddJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAddJobModalOpen(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="size-5 text-blue-400" /> Add Job Manually
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {addJobError && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-2">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <p>{addJobError}</p>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Job URL *</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={addJobUrl}
                    onChange={(e) => setAddJobUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                  <button 
                    onClick={verifyJobUrl}
                    disabled={!addJobUrl || isVerifyingJob}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {isVerifyingJob ? 'Verifying...' : 'Auto-fill'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Job Title *</label>
                <input 
                  type="text" 
                  value={addJobTitle}
                  onChange={(e) => setAddJobTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Company *</label>
                <input 
                  type="text" 
                  value={addJobCompany}
                  onChange={(e) => setAddJobCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Experience Level</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 5+ years, Senior" 
                    value={addJobExp}
                    onChange={(e) => setAddJobExp(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Remote, New York" 
                    value={addJobLocation}
                    onChange={(e) => setAddJobLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Posted Date</label>
                  <input 
                    type="date" 
                    value={addJobPostedDate}
                    onChange={(e) => setAddJobPostedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3">
              <button 
                onClick={() => setIsAddJobModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveManualJob}
                disabled={isSavingJob || !addJobUrl || !addJobTitle || !addJobCompany}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingJob ? 'Saving...' : 'Save Job'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

