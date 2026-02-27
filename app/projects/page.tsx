'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Folder, MoreVertical, Plus } from 'lucide-react'
import Link from 'next/link'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*').order('name')
    if (error) console.error(error)
    setProjects(data || [])
  }

  const handleCreateProject = async () => {
    // Ideally this opens a dialog, but for MVP I'll just add a "New Project" directly
    // Or just alert that this is a placeholder
    const name = prompt("Enter project name:")
    if (name) {
      await supabase.from('projects').insert([{ name, status: 'active' }])
      fetchProjects()
    }
  }

  return (
    <div className="p-4 md:p-8 pt-6 space-y-8 max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-base md:text-lg">Manage your active work streams.</p>
        </div>
        <Button onClick={handleCreateProject} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> New Project</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                {project.name}
              </CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {project.description || "No description provided."}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
               <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
               <Link href={`/kanban?project=${project.id}`}>
                 <Button variant="ghost" size="sm">Open Board</Button>
               </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
