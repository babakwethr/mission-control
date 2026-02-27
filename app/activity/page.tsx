'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { Activity, User, Move, Plus, CheckCircle, Edit } from 'lucide-react'

export default function ActivityPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
    
    // Optional: Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_events',
        },
        (payload) => {
          setEvents((current) => [payload.new, ...current])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('task_events')
      .select('*, tasks(title, project_id)')
      .order('created_at', { ascending: false })
      .limit(50)
    setEvents(data || [])
    setLoading(false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'moved': return <Move className="h-4 w-4 text-blue-500" />
      case 'created': return <Plus className="h-4 w-4 text-green-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-purple-500" />
      case 'updated': return <Edit className="h-4 w-4 text-orange-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="p-8 pt-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground text-lg">Real-time feed of all actions taken by Babak and Sara.</p>
      </div>

      <div className="space-y-4 relative pl-4 border-l-2 border-muted">
        {events.map((event) => (
          <div key={event.id} className="mb-6 relative">
            <div className="absolute -left-[25px] top-1 bg-background p-1 rounded-full border border-muted">
              {getIcon(event.event_type)}
            </div>
            <div className="flex flex-col bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 mb-1">
                   <span className="font-semibold text-sm">{event.actor}</span>
                   <span className="text-xs text-muted-foreground">• {format(new Date(event.created_at), 'MMM d, h:mm a')}</span>
                </div>
              </div>
              <p className="text-sm">
                {event.event_type === 'created' && <>Created task <strong>{event.tasks?.title}</strong></>}
                {event.event_type === 'moved' && <>{event.details} for task <strong>{event.tasks?.title}</strong></>}
                {event.event_type === 'completed' && <>Completed task <strong>{event.tasks?.title}</strong></>}
                {event.event_type === 'updated' && <>Updated task <strong>{event.tasks?.title}</strong></>}
                {event.event_type === 'note' && <>Added note to <strong>{event.tasks?.title}</strong>: "{event.details}"</>}
              </p>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="mt-2 text-xs font-mono bg-muted p-2 rounded">
                  {JSON.stringify(event.metadata)}
                </div>
              )}
            </div>
          </div>
        ))}
        {events.length === 0 && !loading && (
          <p className="text-muted-foreground ml-4">No activity recorded yet.</p>
        )}
      </div>
    </div>
  )
}
