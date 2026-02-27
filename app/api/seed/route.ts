import { supabaseAdmin as supabase } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  // This endpoint requires admin privileges or proper RLS.
  // We use supabaseAdmin (Service Role Key if available) for seeding.
  
  // Seed Projects
  const { data: projects, error: projectsError } = await supabase.from('projects').upsert([
    { name: 'FAMCO Connect', description: 'Industrial Sales Automation', status: 'active' },
    { name: 'Investor Concierge', description: 'Micro-SaaS Product', status: 'active' },
    { name: 'Mekanik.ai', description: 'AI Engineering Tool Product', status: 'active' },
    { name: 'Mosaic Tiles', description: 'New Project', status: 'active' },
    { name: 'Unsorted / Inbox', description: 'Default project for unclassified tasks', status: 'active' },
  ], { onConflict: 'name' }).select()

  if (projectsError) {
    return Response.json({ error: projectsError.message }, { status: 500 })
  }

  // Seed Columns for each project
  for (const project of projects) {
    await supabase.from('columns').upsert([
      { project_id: project.id, name: 'Inbox / Todo', position: 0 },
      { project_id: project.id, name: 'Doing', position: 1 },
      { project_id: project.id, name: 'Blocked / Waiting', position: 2 },
      { project_id: project.id, name: 'Review', position: 3 },
      { project_id: project.id, name: 'Done', position: 4 },
    ], { onConflict: 'project_id, name' })
  }

  return Response.json({ message: 'Seed data completed successfully' })
}
