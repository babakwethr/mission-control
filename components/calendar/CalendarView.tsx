'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight, Clock, ListTodo, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UnifiedEvent {
  id: string
  title: string
  start: string
  end?: string
  type: 'gcal' | 'task'
  priority?: string
  project?: string
}

export function CalendarView() {
  const [events, setEvents] = useState<UnifiedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'month'>('week')
  const supabase = createClient()

  useEffect(() => {
    fetchUnifiedEvents()
  }, [currentDate, view])

  const fetchUnifiedEvents = async () => {
    try {
      // Fetch from unified API
      const res = await fetch('/api/calendar/unified')
      if (res.ok) {
        const data = await res.json()
        
        const unified: UnifiedEvent[] = []
        
        // Process Google Calendar events
        if (data.gcalEvents) {
          data.gcalEvents.forEach((e: any) => {
            unified.push({
              id: e.id,
              title: e.summary || 'Untitled',
              start: e.start?.dateTime || e.start?.date || '',
              end: e.end?.dateTime || e.end?.date,
              type: 'gcal'
            })
          })
        }
        
        // Process Tasks with due dates
        if (data.tasks) {
          data.tasks.forEach((t: any) => {
            if (t.due_date) {
              unified.push({
                id: t.id,
                title: t.title,
                start: t.due_date,
                type: 'task',
                priority: t.priority,
                project: t.columns?.name
              })
            }
          })
        }
        
        setEvents(unified)
      }
    } catch (e) {
      console.error('Error fetching events:', e)
    } finally {
      setLoading(false)
    }
  }

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  const getEventsForDay = (day: Date) => {
    return events.filter(e => {
      if (!e.start) return false
      try {
        return isSameDay(parseISO(e.start), day)
      } catch {
        return false
      }
    })
  }

  const weekDays = getWeekDays()
  const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7am to 8pm

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="p-1 hover:bg-muted rounded"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 text-sm hover:bg-muted rounded"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-1 hover:bg-muted rounded"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('week')}
            className={cn(
              "px-3 py-1 text-sm rounded",
              view === 'week' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            Week
          </button>
          <button
            onClick={() => setView('month')}
            className={cn(
              "px-3 py-1 text-sm rounded",
              view === 'month' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 min-w-[800px]">
            {/* Time column header */}
            <div className="border-b border-r"></div>
            {/* Day headers */}
            {weekDays.map(day => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-2 text-center border-b border-r",
                  isSameDay(day, new Date()) && "bg-primary/5"
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  isSameDay(day, new Date()) && "text-primary"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}

            {/* Time slots */}
            {hours.map(hour => (
              <>
                {/* Time label */}
                <div key={`time-${hour}`} className="border-r p-2 text-xs text-muted-foreground text-right pr-3">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
                {/* Day cells */}
                {weekDays.map(day => {
                  const dayEvents = getEventsForDay(day).filter(e => {
                    try {
                      const eventHour = parseISO(e.start).getHours()
                      return eventHour === hour
                    } catch {
                      return false
                    }
                  })
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="border-r border-b min-h-[60px] p-1"
                    >
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs p-1 rounded mb-1 truncate",
                            event.type === 'gcal' 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" 
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          )}
                          title={event.title}
                        >
                          <span className="font-medium">
                            {event.type === 'gcal' ? '📅' : '📋'} {event.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {weekDays.map(day => {
              const dayEvents = getEventsForDay(day)
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[100px] border rounded p-2",
                    isSameDay(day, new Date()) && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isSameDay(day, new Date()) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-1 rounded truncate",
                          event.type === 'gcal'
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 border-t text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500"></span>
          <span>Google Calendar</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-500"></span>
          <span>Tasks (Due)</span>
        </div>
      </div>
    </div>
  )
}
