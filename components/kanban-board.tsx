'use client'

import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Plus, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Types
interface Task {
  id: string
  title: string
  description: string | null
  priority: 'Low' | 'Medium' | 'High'
  due_date: string | null
  assignee: string
  tags: string[] | null
  column_id: string
}

interface Column {
  id: string
  name: string
  tasks: Task[]
}

interface Project {
  id: string
  name: string
  columns: Column[]
}

export function KanbanBoard({ projectId }: { projectId: string }) {
  const [columns, setColumns] = useState<Column[]>([])
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const fetchProjectData = async () => {
    // Fetch project details
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()
    
    if (project) setProjectName(project.name)

    // Fetch columns and tasks
    const { data: cols } = await supabase
      .from('columns')
      .select(`
        id,
        name,
        position,
        tasks (
          id,
          title,
          description,
          priority,
          due_date,
          assignee,
          tags,
          column_id
        )
      `)
      .eq('project_id', projectId)
      .order('position')
    
    if (cols) {
      // Sort tasks by something meaningful if needed, currently random
      const formattedCols = cols.map(col => ({
        ...col,
        tasks: col.tasks || []
      }))
      setColumns(formattedCols)
    }
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceColIndex = columns.findIndex(col => col.id === source.droppableId)
    const destColIndex = columns.findIndex(col => col.id === destination.droppableId)
    
    const sourceCol = columns[sourceColIndex]
    const destCol = columns[destColIndex]

    const sourceTasks = Array.from(sourceCol.tasks)
    const destTasks = sourceCol === destCol ? sourceTasks : Array.from(destCol.tasks)
    
    const [movedTask] = sourceTasks.splice(source.index, 1)

    if (sourceCol === destCol) {
      sourceTasks.splice(destination.index, 0, movedTask)
      const newColumns = [...columns]
      newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks }
      setColumns(newColumns)
    } else {
      destTasks.splice(destination.index, 0, movedTask)
      const newColumns = [...columns]
      newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks }
      newColumns[destColIndex] = { ...destCol, tasks: destTasks }
      setColumns(newColumns)

      // Update task column in DB
      await supabase
        .from('tasks')
        .update({ column_id: destination.droppableId })
        .eq('id', draggableId)
      
      // Log event
      await supabase.from('task_events').insert({
        task_id: draggableId,
        actor: 'Babak', // TODO: get current user
        event_type: 'moved',
        details: `Moved from ${sourceCol.name} to ${destCol.name}`
      })
    }
  }

  const handleCreateTask = async () => {
    const title = prompt("Enter task title:")
    if (!title || !columns.length) return

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert([
        { 
          title, 
          project_id: projectId, 
          column_id: columns[0].id,
          priority: 'Medium',
          assignee: 'Babak'
        }
      ])
      .select()
      .single()

    if (error) {
      alert("Error creating task: " + error.message)
    } else {
      fetchProjectData()
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b bg-background gap-4">
        <h2 className="text-lg font-semibold">{projectName} Board</h2>
        <Button size="sm" onClick={handleCreateTask} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> New Task</Button>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full gap-4 pb-4">
            {columns.map((column) => (
              <div key={column.id} className="w-[280px] sm:w-80 flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    {column.name} <span className="text-xs bg-muted px-2 py-0.5 rounded-full ml-2">{column.tasks.length}</span>
                  </h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3 w-3" /></Button>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex-1 bg-muted/50 rounded-lg p-2 overflow-y-auto space-y-2 min-h-[100px]"
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-sm font-medium leading-tight">{task.title}</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                   <div className="flex items-center gap-2">
                                     {task.assignee === 'Sara' ? (
                                       <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-purple-100 text-purple-700 hover:bg-purple-100">Sara</Badge>
                                     ) : (
                                       <Badge variant="secondary" className="text-[10px] h-5 px-1">Babak</Badge>
                                     )}
                                   </div>
                                   {task.due_date && (
                                     <div className={cn("flex items-center gap-1", new Date(task.due_date) < new Date() ? "text-red-500" : "")}>
                                       <CalendarIcon className="h-3 w-3" />
                                       <span>{format(new Date(task.due_date), 'MMM d')}</span>
                                     </div>
                                   )}
                                </div>
                                
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {task.tags.map(tag => (
                                      <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
