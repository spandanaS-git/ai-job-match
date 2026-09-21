import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, company, url, experience_required, location, posted_at } = body

    if (!title || !company || !url) {
      return NextResponse.json({ error: 'Title, company, and URL are required' }, { status: 400 })
    }

    // Check if job already exists
    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('url', url)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Job already exists' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([
        { 
          title, 
          company, 
          url, 
          experience_required: experience_required || 'Not Specified',
          location: location || 'Remote',
          source: 'manual',
          created_at: new Date().toISOString(),
          posted_at: posted_at ? new Date(posted_at).toISOString() : new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, job: data[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
