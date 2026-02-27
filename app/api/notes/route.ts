import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/notes - List all notes
export async function GET() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })
  
  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data || [])
}

// POST /api/notes - Create a new note
export async function POST(request: Request) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('notes')
      .insert({
        title: body.title || 'Untitled',
        content: body.content || '',
        tags: body.tags || []
      })
      .select()
      .single()
    
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Notes table not configured. Run migration in Supabase.',
          migration: `CREATE TABLE notes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            content TEXT,
            tags TEXT[],
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );`
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
