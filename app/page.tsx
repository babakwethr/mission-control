'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, AlertCircle, ArrowRight, PlayCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function MorningBriefPage() {
  const [topTasks, setTopTasks] = useState<any[]>([])
  const [doingTasks, setDoingTasks] = useState<any[]>([])
  const [completedTasks, setCompletedTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
        const today = new Date().toISOString()
        
        // Fetch projects for reference
        const { data: projectsData, error: projectsError } = await supabase.from('projects').select('id, name')
        if (projectsError) throw projectsError
        setProjects(projectsData || [])

        // Fetch Top Tasks (High Priority OR Due Soon, Not Done)
        const { data: top, error: topError } = await supabase
        .from('tasks')
        .select('*, columns!inner(name)')
        .neq('columns.name', 'Done')
        .order('priority', { ascending: false })
        .limit(10)
        
        if (topError) throw topError
        
        const filteredTop = top?.filter(t => t.priority === 'High' || (t.due_date && new Date(t.due_date) <= new Date())) || []
        setTopTasks(filteredTop)

        // Fetch Doing Tasks
        const { data: doing, error: doingError } = await supabase
        .from('tasks')
        .select('*, columns!inner(name)')
        .eq('columns.name', 'Doing')
        
        if (doingError) throw doingError
        setDoingTasks(doing || [])

        // Fetch Completed Tasks (Last 24h)
        const yesterday = new Date(Date.now() - 86400000).toISOString()
        const { data: completed, error: completedError } = await supabase
        .from('tasks')
        .select('*, columns!inner(name)')
        .eq('columns.name', 'Done')
        .gte('updated_at', yesterday)
        
        if (completedError) throw completedError
        setCompletedTasks(completed || [])
    } catch (e) {
        console.error("Error fetching data:", e)
    } finally {
        setLoading(false)
    }
  }

  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown Project'

  if (loading) {
      return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="p-4 md:p-8 pt-6 space-y-8 max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Good Morning, Babak.</h1>
        <p className="text-muted-foreground text-base md:text-lg">Here is your briefing for today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Briefing Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sara's Plan / Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <PlayCircle className="h-5 w-5 shrink-0" />
                Sara's Daily Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  I've reviewed your projects. Today's focus should be on <strong>Mekanik.ai</strong> launch preparations. 
                  I've moved the "Landing Page" tasks to <em>Doing</em>.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Monitor Investor Lounge feedback</li>
                  <li>Follow up on FAMCO Connect lead</li>
                  <li>Ensure Mosaic Tiles moodboard is reviewed</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Current Focus (Doing) */}
          <section>
             <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
               <ArrowRight className="h-5 w-5 text-blue-500" /> In Progress (Doing)
             </h2>
             {doingTasks.length === 0 ? (
               <div className="p-8 border rounded-lg bg-muted/20 text-center text-muted-foreground border-dashed">
                 Nothing in progress right now. Drag tasks to 'Doing' to start.
               </div>
             ) : (
               <div className="grid gap-3">
                 {doingTasks.map(task => (
                   <div key={task.id} className="flex items-start justify-between p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                     <div className="space-y-1">
                       <h3 className="font-medium leading-none">{task.title}</h3>
                       <p className="text-sm text-muted-foreground">{getProjectName(task.project_id)}</p>
                     </div>
                     <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'}>{task.priority}</Badge>
                   </div>
                 ))}
               </div>
             )}
          </section>

          {/* Top Priorities */}
          <section>
             <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
               <AlertCircle className="h-5 w-5 text-amber-500" /> Needs Attention
             </h2>
             <div className="grid gap-3">
               {topTasks.map(task => (
                 <div key={task.id} className="flex items-start justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                   <div className="flex gap-3">
                     <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                     <div className="space-y-1">
                       <h3 className="font-medium leading-none">{task.title}</h3>
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <span className="bg-muted px-1.5 py-0.5 rounded text-xs">{getProjectName(task.project_id)}</span>
                         {task.due_date && (
                           <span className={cn("flex items-center gap-1", new Date(task.due_date) < new Date() ? "text-red-500 font-medium" : "")}>
                             • Due {format(new Date(task.due_date), 'MMM d')}
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                   <Badge>{task.priority}</Badge>
                 </div>
               ))}
               {topTasks.length === 0 && (
                 <p className="text-muted-foreground text-sm italic">No urgent tasks. You're all caught up!</p>
               )}
             </div>
          </section>

        </div>

        {/* Sidebar Stats Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Overnight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedTasks.length > 0 ? (
                  completedTasks.map(task => (
                    <div key={task.id} className="flex gap-2 items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium leading-none line-through decoration-muted-foreground/50 text-muted-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{getProjectName(task.project_id)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tasks completed recently.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects Health</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-2">
                 {projects.map(p => (
                   <div key={p.id} className="flex justify-between items-center text-sm py-1 border-b last:border-0 border-border/50">
                     <span className="font-medium truncate max-w-[150px]">{p.name}</span>
                     <Badge variant="outline" className="text-[10px] font-normal h-5 px-1.5">Active</Badge>
                   </div>
                 ))}
                 {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects found.</p>}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
