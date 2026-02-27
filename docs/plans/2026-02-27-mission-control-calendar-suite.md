# Mission Control Calendar Suite - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal "Mission Control" suite that replaces Google Calendar, Notion, and Todoist with agent-native tools deeply connected to everything Sara knows about Babak.

**Architecture:** 
- Next.js frontend (existing at /root/.openclaw/workspace/mission-control)
- Supabase backend (existing, connected)
- Telegram bot for natural language input
- Google Calendar API integration
- OpenClaw agent work tracking

**Tech Stack:** Next.js 14, Supabase, Google Calendar API, Telegram Bot API, OpenClaw tools

---

## Phase 1: Calendar Integration (Week 1)

### Task 1: Google Calendar API Setup

**Files:**
- Create: `mission-control/.env.local` (append)
- Create: `mission-control/lib/googleCalendar.ts`

**Step 1: Add Google Calendar credentials to .env.local**

Append to .env.local:
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
```

**Step 2: Create Google Calendar client**

```typescript
// lib/googleCalendar.ts
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

export async function getEvents(timeMin: string, timeMax: string) {
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  })
  return response.data.items || []
}
```

**Step 3: Verify**

Run: `echo "Google Calendar lib created"`
Expected: Success

**Step 4: Commit**

```bash
git add .env.local lib/googleCalendar.ts
git commit -m "feat: add Google Calendar integration"
```

---

### Task 2: Calendar UI Component

**Files:**
- Create: `mission-control/components/calendar/EventCalendar.tsx`
- Create: `mission-control/app/calendar/page.tsx`

**Step 1: Create EventCalendar component**

```tsx
// components/calendar/EventCalendar.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function EventCalendar() {
  const [events, setEvents] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  
  useEffect(() => {
    // Fetch both Google Calendar events and Supabase tasks
    fetch('/api/calendar/events').then(res => res.json()).then(setEvents)
    // Fetch tasks from Supabase
  }, [])
  
  // Render unified timeline view
}
```

**Step 2: Create calendar page**

```tsx
// app/calendar/page.tsx
import { EventCalendar } from '@/components/calendar/EventCalendar'

export default function CalendarPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Mission Control Calendar</h1>
      <EventCalendar />
    </div>
  )
}
```

**Step 3: Verify**

Run: `curl http://localhost:3000/calendar`
Expected: Calendar page loads

**Step 4: Commit**

```bash
git add components/calendar/ app/calendar/
git commit -m "feat: add calendar UI with events + tasks view"
```

---

### Task 3: Unified Events API

**Files:**
- Create: `mission-control/app/api/calendar/events/route.ts`

**Step 1: Create unified events endpoint**

```typescript
// app/api/calendar/events/route.ts
import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/googleCalendar'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const timeMin = searchParams.get('timeMin') || new Date().toISOString()
  const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  
  // Get Google Calendar events
  const gcalEvents = await getEvents(timeMin, timeMax)
  
  // Get Supabase tasks (with due dates)
  const supabase = createClient()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, columns!inner(name)')
    .not('due_date', 'is', null)
    .gte('due_date', timeMin)
    .lte('due_date', timeMax)
  
  return NextResponse.json({ gcalEvents, tasks })
}
```

**Step 2: Test**

Run: `curl http://localhost:3000/api/calendar/events`
Expected: JSON with both events and tasks

**Step 3: Commit**

```bash
git add app/api/calendar/
git commit -m "feat: unified calendar API (GCal + Tasks)"
```

---

## Phase 2: Telegram Natural Language Input (Week 2)

### Task 4: Telegram Bot Setup

**Files:**
- Create: `mission-control/lib/telegram.ts`
- Create: `mission-control/app/api/telegram/webhook/route.ts`

**Step 1: Create Telegram bot utility**

```typescript
// lib/telegram.ts
import TelegramBot from 'node-telegram-bot-api'

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true })

export async function sendMessage(chatId: string, text: string) {
  return bot.sendMessage(chatId, text)
}

export function parseNaturalLanguage(text: string) {
  // Parse "Meeting with John tomorrow at 3pm" 
  // Parse "Buy milk due Friday" -> task
  // Parse "Note: ideas for project" -> note
  // Use NLP or rule-based parsing
}
```

**Step 2: Create webhook handler**

```typescript
// app/api/telegram/webhook/route.ts
import { NextResponse } from 'next/server'
import { parseNaturalLanguage } from '@/lib/telegram'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { message } = body
  
  const parsed = parseNaturalLanguage(message.text)
  
  const supabase = createClient()
  
  if (parsed.type === 'task') {
    await supabase.from('tasks').insert({
      title: parsed.title,
      due_date: parsed.dueDate,
      priority: parsed.priority || 'Medium',
      project_id: parsed.projectId,
    })
  } else if (parsed.type === 'event') {
    // Create Google Calendar event
  }
  
  return NextResponse.json({ ok: true })
}
```

**Step 3: Commit**

```bash
git add lib/telegram.ts app/api/telegram/
git commit -m "feat: add Telegram bot for NL input"
```

---

### Task 5: Natural Language Parser

**Files:**
- Modify: `mission-control/lib/telegram.ts`

**Step 1: Implement NLP parser**

```typescript
// Enhanced parseNaturalLanguage function
function parseNaturalLanguage(text: string) {
  const patterns = [
    { regex: /(.+) due (.+)/i, type: 'task' },
    { regex: /(.+) at (.+)/i, type: 'event' },
    { regex: /(.+) by (.+)/i, type: 'task' },
    { regex: /note:(.+)/i, type: 'note' },
  ]
  
  // Extract dates using date-fns
  // Extract project names from known projects
  // Return structured object
}
```

**Step 2: Test with sample inputs**

```
"Call mom Saturday at 10am" -> event
"Finish report due Friday" -> task  
"Note: Ideas for Q4" -> note
```

**Step 3: Commit**

```bash
git add lib/telegram.ts
git commit -m "feat: NL parser for Telegram input"
```

---

## Phase 3: Agent Work Tracking (Week 2)

### Task 6: Agent Runs Table Population

**Files:**
- Create: `mission-control/app/api/agent/runs/route.ts`

**Step 1: Create agent runs API**

```typescript
// app/api/agent/runs/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('agent_runs')
    .insert({
      run_type: body.runType,
      summary: body.summary,
      plan: body.plan,
      metadata: body.metadata,
    })
    .select()
  
  return NextResponse.json({ data, error })
}
```

**Step 2: Modify OpenClaw to log runs**

In OpenClaw session, after each task completion:
```
POST to /api/agent/runs with { runType, summary, metadata }
```

**Step 3: Commit**

```bash
git add app/api/agent/
git commit -m "feat: agent runs tracking API"
```

---

### Task 7: Agent Activity Dashboard

**Files:**
- Create: `mission-control/app/activity/page.tsx`

**Step 1: Create activity page**

```tsx
// app/activity/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ActivityPage() {
  const [runs, setRuns] = useState<any[]>([])
  
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('agent_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setRuns(data || []))
  }, [])
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Sara's Activity Log</h1>
      {runs.map(run => (
        <div key={run.id} className="border-b py-4">
          <p className="font-medium">{run.summary}</p>
          <p className="text-sm text-gray-500">{new Date(run.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/activity/
git commit -m "feat: agent activity dashboard"
```

---

## Phase 4: Notes/Todos Replacement (Week 3)

### Task 8: Notes System

**Files:**
- Create: `mission-control/app/notes/page.tsx`
- Create: `mission-control/app/api/notes/route.ts`

**Step 1: Create notes table in Supabase**

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Step 2: Create notes API**

```typescript
// app/api/notes/route.ts
// CRUD for notes
```

**Step 3: Create notes UI**

```tsx
// app/notes/page.tsx
// - Create/Edit/Delete notes
// - Tag-based filtering
// - Full-text search
```

**Step 4: Commit**

```bash
git add app/notes/ app/api/notes/
git commit -m "feat: notes system (Notion alternative)"
```

---

### Task 9: Todos with Context

**Files:**
- Modify: `mission-control/app/tasks/page.tsx`

**Step 1: Enhance existing tasks UI**

- Add "Added by Sara" indicator
- Show AI-suggested tasks
- Add natural language quick-add

**Step 2: Commit**

```bash
git add app/tasks/
git commit -m "feat: enhanced todos with AI context"
```

---

## Phase 5: Deep Sara Integration (Week 3-4)

### Task 10: Connect Sara's Memory

**Files:**
- Modify: `mission-control/lib/memory.ts`

**Step 1: Query Babak's preferences**

From MEMORY.md, USER.md:
- Preferred working hours
- Active projects
- Key contacts
- Meeting patterns

**Step 2: Use in UI**

Display "Based on your patterns..." insights

**Step 3: Commit**

```bash
git add lib/memory.ts
git commit -m "feat: connect Sara's memory to UI"
```

---

### Task 11: Automated Daily Brief

**Files:**
- Modify: `mission-control/app/page.tsx`

**Step 1: Enhance morning brief**

- Pull from Google Calendar
- Pull from tasks (due today)
- Pull from agent_runs (completed yesterday)
- Add "Sara's Recommendations"

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: automated daily brief with all data sources"
```

---

## Summary

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| 1 | Calendar | Unified GCal + Tasks view |
| 2 | Telegram | NL input for tasks/events |
| 3 | Work Tracking | Agent activity log |
| 4 | Notes/Todos | Replace Notion/Todoist |
| 5 | Deep Integration | Sara memory + daily brief |

---

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
