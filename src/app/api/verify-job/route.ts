import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    // 1. Check if job already exists in DB based on base URL (strip query params)
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

    try {
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
            // Paylocity puts Company Name before Job Title
            company = parts[0].trim()
            title = parts.length > 1 ? parts[1].trim() : ''
          } else {
            // Default assumes Job Title before Company
            title = parts[0].trim()
            company = parts.length > 1 ? parts[1].trim() : ''
          }
        } else {
          title = pageTitle
        }
        title = title.replace(/Job Application for /ig, '').replace(/Careers/ig, '').trim()

        // Extract experience from HTML body
        const expMatch = html.match(/(\d+)\+?\s*years?[^\.]{0,40}?experience/i) || html.match(/(\d+)\+?\s*years?/i)
        if (expMatch) {
          experience = `${expMatch[1]}+ years`
        }
        
        // Extract posted date from structured data or meta tags
        const dateMatch = html.match(/"datePosted"\s*:\s*"([^"]+)"/i) || 
                          html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/i) ||
                          html.match(/<time[^>]*datetime="([^"]+)"/i) ||
                          html.match(/"postedAt"\s*:\s*"([^"]+)"/i)
        if (dateMatch && dateMatch[1]) {
          postedDate = dateMatch[1]
        }
      }
    } catch (e) {
      // Ignore fetch errors, fallback to URL parsing
    }
    
    // Fallback: If title/company is missing (e.g. 403 Forbidden Cloudflare block), parse the URL
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

    return NextResponse.json({ title, company, experience, postedDate })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
