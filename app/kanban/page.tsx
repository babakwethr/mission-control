'use client'

import { useState, useEffect, Suspense } from 'react'
import { KanbanBoard } from '@/components/kanban-board'
import { CalendarView } from '@/components/calendar/CalendarView'
import { supabase } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, LayoutGrid, CalendarDays } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

function KanbanContent() {
  const [projects, setProjects] = useState<{id: string, name: string}[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban')
  const searchParams = useSearchParams()
  const projectIdParam = searchParams.get('project')

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('id, name').eq('status', 'active').order('name')
      if (data) {
        setProjects(data)
        if (projectIdParam) {
           const exists = data.find(p => p.id === projectIdParam)
           if (exists) setSelectedProject(projectIdParam)
           else if (data.length > 0) setSelectedProject(data[0].id)
        } else if (data.length > 0) {
          setSelectedProject(data[0].id)
        }
      }
      setLoading(false)
    }
    fetchProjects()
  }, [projectIdParam])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mission Control</h2>
        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                viewMode === 'kanban' 
                  ? "bg-background shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                viewMode === 'calendar' 
                  ? "bg-background shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </button>
          </div>
          
          {/* Project Selector (only for Kanban) */}
          {viewMode === 'kanban' && (
            <Select value={selectedProject || ''} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      
      {viewMode === 'calendar' ? (
        <div className="flex-1 border rounded-lg overflow-hidden bg-background shadow-sm">
          <CalendarView />
        </div>
      ) : selectedProject ? (
        <div className="flex-1 border rounded-lg overflow-hidden bg-background shadow-sm">
           <KanbanBoard projectId={selectedProject} />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Please select a project to view its board.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function KanbanPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <KanbanContent />
    </Suspense>
  )
}
