import { supabaseAdmin as supabase } from '@/lib/supabase/admin'

async function seedColumns() {
  const { data: projects } = await supabase.from('projects').select('id, name')
  
  if (!projects) return

  for (const project of projects) {
    const defaultColumns = [
      { name: 'Inbox / Todo', position: 0 },
      { name: 'In Progress', position: 1 },
      { name: 'Review', position: 2 },
      { name: 'Done', position: 3 }
    ]

    for (const col of defaultColumns) {
      await supabase.from('columns').upsert({
        project_id: project.id,
        name: col.name,
        position: col.position
      }, { onConflict: 'project_id,name' })
    }
  }
}

seedColumns().then(() => console.log('Columns seeded'))
