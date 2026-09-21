import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      return NextResponse.json({ error: Failed to fetch URL. Status:  }, { status: 400 })
    }

    const html = await response.text()
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const pageTitle = titleMatch ? titleMatch[1].trim() : ''
    
    // Try to parse Title and Company
    let title = ''
    let company = ''
    
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

    return NextResponse.json({ title, company })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
