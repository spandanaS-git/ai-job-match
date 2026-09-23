import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function extractExperience(text: string): string {
  if (!text) return ''
  const clean = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')

  const numberWords: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20
  }

  const foundYears: number[] = []

  // Pattern 1: Numeric counts (with optional written numbers or parenthesized digits e.g. "ONE (1) year", "1+ years", "1-3 years")
  const p1 = /(?:at\s+least\s+|minimum\s+(?:of\s+)?|min\.?\s+|typical(?:ly)?\s*,?\s*)?(?:(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\s*)?\(?(\d+)\)?(?:\s*-\s*\d+)?\+?\s*(?:or\s+more\s+)?years?(?:[^\.\n\r;]{0,60}?(?:experience|exp|background|track\s*record|demonstrated|relevant|working))?/gi
  for (const m of clean.matchAll(p1)) {
    const num = parseInt(m[1], 10)
    if (num >= 1 && num <= 20) {
      foundYears.push(num)
    }
  }

  // Pattern 2: Written-out counts e.g. "one year", "two years", "ONE (1) year"
  const p2 = /(?:at\s+least\s+|minimum\s+(?:of\s+)?|min\.?\s+|typical(?:ly)?\s*,?\s*)?\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\b(?:\s*\(\s*\d+\s*\))?\s*(?:or\s+more\s+)?years?(?:[^\.\n\r;]{0,60}?(?:experience|exp|background|track\s*record|demonstrated|relevant|working))?/gi
  for (const m of clean.matchAll(p2)) {
    const word = m[1].toLowerCase()
    if (numberWords[word]) {
      foundYears.push(numberWords[word])
    }
  }

  // Pattern 3: YOE shorthand
  const p3 = /(\d+)\+?\s*(?:yoe|years?\s*of\s*experience)/gi
  for (const m of clean.matchAll(p3)) {
    const num = parseInt(m[1], 10)
    if (num >= 1 && num <= 20) {
      foundYears.push(num)
    }
  }

  if (foundYears.length > 0) {
    const maxYears = Math.max(...foundYears)
    return `${maxYears}+ years`
  }

  return ''
}

function parseRelativeOrAbsoluteDate(dateStr: string): string {
  if (!dateStr) return ''
  const trimmed = dateStr.trim()

  const today = new Date()
  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (/today/i.test(trimmed)) {
    return formatDate(today)
  }
  if (/yesterday/i.test(trimmed)) {
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    return formatDate(yesterday)
  }
  const daysAgoMatch = trimmed.match(/(\d+)\+?\s*days?\s*ago/i)
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10)
    const past = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    return formatDate(past)
  }
  const monthsAgoMatch = trimmed.match(/(\d+)\+?\s*months?\s*ago/i)
  if (monthsAgoMatch) {
    const months = parseInt(monthsAgoMatch[1], 10)
    const past = new Date(today.getTime() - months * 30 * 24 * 60 * 60 * 1000)
    return formatDate(past)
  }

  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    return formatDate(parsed)
  }

  return ''
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    // 1. Check if job already exists in DB based on base URL
    const baseUrl = url.split('?')[0]
    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .filter('url', 'ilike', `${baseUrl}%`)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Job already exists in your feed!' }, { status: 400 })
    }

    let title = ''
    let company = ''
    let experience = ''
    let postedDate = ''
    let location = ''

    // ── Workday special handler ────────────────────────────────────────────
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname.includes('myworkdayjobs.com')) {
        const tenant = urlObj.hostname.split('.')[0]   // e.g. "guidehouse"
        const wdVersion = urlObj.hostname.split('.')[1] // e.g. "wd1"
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        
        const jobIdx = pathParts.indexOf('job')
        let careerSite = pathParts[0]
        let jobPath = ''
        if (jobIdx > 0) {
          careerSite = pathParts[jobIdx - 1]
          jobPath = pathParts.slice(jobIdx + 1).join('/')
        } else if (pathParts.length > 1) {
          careerSite = pathParts[0]
          jobPath = pathParts.slice(1).join('/')
        }

        company = tenant.replace(/([a-z])([A-Z])/g, '$1 $2')
                        .split(/[-_]/)
                        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')

        const apiUrl = `https://${tenant}.${wdVersion}.myworkdayjobs.com/wday/cxs/${tenant}/${careerSite}/job/${jobPath}`
        const wdRes = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*'
          }
        })
        if (wdRes.ok) {
          const wdData = await wdRes.json()
          const posting = wdData.jobPostingInfo || wdData
          if (posting.title) title = posting.title
          if (posting.startDate) {
            postedDate = parseRelativeOrAbsoluteDate(posting.startDate)
          } else if (posting.postedOn) {
            postedDate = parseRelativeOrAbsoluteDate(posting.postedOn)
          }
          
          // Location from Workday
          if (typeof posting.location === 'string' && posting.location.trim()) {
            location = posting.location.trim()
          } else if (posting.jobPostingLocation && typeof posting.jobPostingLocation === 'string') {
            location = posting.jobPostingLocation.trim()
          } else if (posting.jobPostingLocation?.descriptor) {
            location = posting.jobPostingLocation.descriptor.trim()
          } else if (Array.isArray(posting.jobPostingLocations) && posting.jobPostingLocations.length > 0) {
            const loc = posting.jobPostingLocations[0]
            location = loc.descriptor || loc.name || loc.location || ''
          } else if (typeof posting.locationsText === 'string') {
            location = posting.locationsText
          } else if (posting.remoteType) {
            location = typeof posting.remoteType === 'string' ? posting.remoteType : (posting.remoteType.descriptor || 'Remote')
          }

          // Description and Experience from Workday
          const descHtml: string = typeof posting.jobDescription === 'string'
            ? posting.jobDescription
            : (posting.jobDescription?.content || posting.description || '')
          const expFromDesc = extractExperience(descHtml)
          if (expFromDesc) experience = expFromDesc
        } else {
          const lastSegment = pathParts[pathParts.length - 1] || ''
          const slug = lastSegment.replace(/_[^_]+$/, '')
          title = slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        }

        // Fallback location from URL path e.g. /job/US-MD-Bethesda/...
        if (!location && jobIdx !== -1 && jobIdx + 1 < pathParts.length) {
          const locSegment = pathParts[jobIdx + 1]
          if (locSegment && locSegment !== pathParts[pathParts.length - 1]) {
            location = locSegment.replace(/[-_]/g, ' ')
          }
        }
      }
    } catch (_) { /* ignore workday error, fall through */ }
    // ── End Workday handler ────────────────────────────────────────────────

    if (!title || !company) try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        const pageTitle = titleMatch ? titleMatch[1].trim() : ''
        
        if (pageTitle.includes(' at ')) {
          const parts = pageTitle.split(' at ')
          title = parts[0].trim()
          company = parts[1].split(/[|\-]/)[0].trim() 
        } else if (pageTitle.includes(' | ')) {
          const parts = pageTitle.split(' | ')
          title = parts[0].trim()
          company = parts.length > 1 ? parts[1].trim() : ''
        } else if (pageTitle.includes(' - ')) {
          const parts = pageTitle.split(' - ')
          if (url.includes('paylocity.com')) {
            company = parts[0].trim()
            title = parts.length > 1 ? parts[1].trim() : ''
          } else {
            title = parts[0].trim()
            company = parts.length > 1 ? parts[1].trim() : ''
          }
        } else {
          title = pageTitle
        }
        title = title.replace(/Job Application for /ig, '').replace(/Careers/ig, '').trim()

        const expFromHtml = extractExperience(html)
        if (expFromHtml) experience = expFromHtml
        
        const dateMatch = html.match(/"datePosted"\s*:\s*"([^"]+)"/i) || 
                          html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/i) ||
                          html.match(/<time[^>]*datetime="([^"]+)"/i) ||
                          html.match(/"postedAt"\s*:\s*"([^"]+)"/i)
        if (dateMatch && dateMatch[1]) {
          postedDate = parseRelativeOrAbsoluteDate(dateMatch[1])
        }

        if (!location) {
          const jsonLdLoc = html.match(/"jobLocation"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i) ||
                            html.match(/"addressLocality"\s*:\s*"([^"]+)"/i) ||
                            html.match(/"workplaceType"\s*:\s*"([^"]+)"/i)
          if (jsonLdLoc) {
            location = jsonLdLoc[1]
          } else {
            const remoteMatch = html.match(/\b(fully\s+remote|100%\s+remote|remote\s+only)\b/i)
            const hybridMatch = html.match(/\b(hybrid)\b/i)
            const onsiteMatch = html.match(/\b(on-?site|in\s+office|in-?person)\b/i)
            const cityMatch = html.match(/(?:location|based in|office)[^<]{0,80}?([A-Z][a-z]+(?: [A-Z][a-z]+)*,\s*[A-Z]{2})/i)
            if (remoteMatch) location = 'Remote'
            else if (hybridMatch) location = 'Hybrid'
            else if (cityMatch) location = cityMatch[1].trim()
            else if (onsiteMatch) location = 'On-site'
          }
        }
      }
    } catch (e) {
      // Ignore fetch errors, fallback to URL parsing
    }
    
    // Fallback: URL parsing
    if (!title || !company) {
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        
        if (urlObj.hostname.includes('himalayas.app') && pathParts.includes('companies') && pathParts.includes('jobs')) {
          company = pathParts[pathParts.indexOf('companies') + 1] || company
          title = pathParts[pathParts.indexOf('jobs') + 1] || title
        } else if (urlObj.hostname.includes('greenhouse.io')) {
          company = pathParts[0] || company
        } else if (urlObj.hostname.includes('lever.co')) {
          company = pathParts[0] || company
        }
        
        if (title && title === title.toLowerCase()) {
          title = title.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }
        if (company && company === company.toLowerCase()) {
          company = company.charAt(0).toUpperCase() + company.slice(1)
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }

    // Fallback experience extraction from title
    if (!experience && title) {
      const tLower = title.toLowerCase()
      if (['staff', 'principal', 'vp', 'director', 'head', 'manager', 'lead', 'senior', 'sr.', 'sr ', 'chief'].some(k => tLower.includes(k))) {
        experience = 'Senior'
      } else if (['mid', 'intermediate'].some(k => tLower.includes(k))) {
        experience = 'Mid-level'
      } else if (['junior', 'jr', 'entry', 'intern', 'grad'].some(k => tLower.includes(k))) {
        experience = 'Entry Level'
      } else {
        experience = 'Not Specified'
      }
    }
    
    if (!title && !company) {
      return NextResponse.json({ error: `Could not parse automatically. Please fill manually.` }, { status: 400 })
    }

    return NextResponse.json({ title, company, experience, postedDate, location })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
