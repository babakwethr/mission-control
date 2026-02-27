import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/googleCalendar'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()
  const timeMin = now.toISOString()
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  
  // Google Calendar events (if configured)
  let gcalEvents: any[] = []
  try {
    gcalEvents = await getEvents(timeMin, timeMax)
  } catch (e) {
    console.log('GCal not available:', e)
  }
  
  // Supabase tasks with due dates
  const supabase = await createClient()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, columns!inner(name)')
    .not('due_date', 'is', null)
    .gte('due_date', timeMin)
    .lte('due_date', timeMax)
    .order('due_date', { ascending: true })
  
  return NextResponse.json({
    gcalEvents,
    tasks: tasks || []
  })
}
