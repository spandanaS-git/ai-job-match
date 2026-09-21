import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    let title = ''
    let company = ''

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
          title = parts[0].trim()
          company = parts.length > 1 ? parts[1].trim() : ''
        } else {
          title = pageTitle
        }
        title = title.replace(/Job Application for /ig, '').replace(/Careers/ig, '').trim()
      }
    } catch (e) {
      // Ignore fetch errors, fallback to URL parsing
    }
    
    // Fallback: If title/company is missing (e.g. 403 Forbidden Cloudflare block), parse the URL
    if (!title || !company) {
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        
        // himalayas.app/companies/nttdata/jobs/data-engineer
        if (urlObj.hostname.includes('himalayas.app') && pathParts.includes('companies') && pathParts.includes('jobs')) {
          company = pathParts[pathParts.indexOf('companies') + 1] || company
          title = pathParts[pathParts.indexOf('jobs') + 1] || title
        } 
        // boards.greenhouse.io/spacex/jobs/12345
        else if (urlObj.hostname.includes('greenhouse.io')) {
          company = pathParts[0] || company
        }
        // jobs.lever.co/stripe/12345
        else if (urlObj.hostname.includes('lever.co')) {
          company = pathParts[0] || company
        }
        
        // Clean up URL-based strings (e.g. data-engineer -> Data Engineer)
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
    
    if (!title && !company) {
      return NextResponse.json({ error: `Could not parse automatically. Please fill manually.` }, { status: 400 })
    }

    return NextResponse.json({ title, company })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
