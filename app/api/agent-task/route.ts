import { supabaseAdmin as supabase } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Use supabaseAdmin to bypass RLS for agent actions
  const { prompt } = await request.json()

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  // 1. Fetch Projects for Classification
  const { data: projects } = await supabase.from('projects').select('id, name')
  
  if (!projects) {
    return NextResponse.json({ error: 'No projects found' }, { status: 500 })
  }

  // 2. Simple Rule-Based Classification (Mocking LLM)
  let projectId = projects.find(p => p.name === 'Unsorted / Inbox')?.id
  let targetProjectName = 'Unsorted / Inbox'

  const lowerPrompt = prompt.toLowerCase()
  
  for (const p of projects) {
    if (lowerPrompt.includes(p.name.toLowerCase().split(' ')[0])) { // Simple match first word
      projectId = p.id
      targetProjectName = p.name
      break
    }
  }
  
  // Fallback if Inbox not found (should be seeded)
  if (!projectId && projects.length > 0) {
      projectId = projects[0].id
      targetProjectName = projects[0].name
  }

  // 3. Create Task
  // Fetch 'Inbox / Todo' column for the project
  const { data: column } = await supabase
    .from('columns')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', 'Inbox / Todo')
    .single()
  
  const columnId = column?.id

  if (!columnId) {
      return NextResponse.json({ error: `Inbox column not found for project ${targetProjectName}` }, { status: 500 })
  }

  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      column_id: columnId,
      title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''), // Simple title extraction
      description: prompt,
      priority: 'Medium',
      assignee: 'Sara',
      tags: targetProjectName === 'Unsorted / Inbox' ? ['needs_project'] : [],
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 4. Log Event
  await supabase.from('task_events').insert({
    task_id: newTask.id,
    actor: 'Sara',
    event_type: 'created',
    metadata: { 
        source: 'api', 
        original_prompt: prompt,
        project: targetProjectName
    }
  })

  return NextResponse.json({ 
    success: true, 
    task: newTask,
    message: `Created task in ${targetProjectName}`
  })
}
