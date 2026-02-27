# Mission Control Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Calendar, Telegram Input, Work Tracking, and Notes into EXISTING Mission Control structure — not as separate pages but as seamless features.

**Architecture:** Next.js + Supabase (existing), add Telegram Bot + Google Calendar + Notes

---

## Integration Mapping

| New Feature | Integrate Into | Method |
|-------------|----------------|--------|
| Calendar | /kanban | Add calendar view toggle to Kanban |
| Telegram Input | Backend | New API endpoint, existing Telegram bot |
| Work Tracking | /activity | Add "Agent Runs" tab + Sara's daily work |
| Notes | /notes | NEW page (Notion alternative) |
| Daily Brief | / (Morning Brief) | Pull all data sources |

---

## Task 1: Add Calendar View to Existing Kanban

**Files:**
- Modify: `mission-control/app/kanban/page.tsx`
- Create: `mission-control/components/calendar/CalendarView.tsx`

**Step 1: Create CalendarView component**

```tsx
// components/calendar/CalendarView.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfWeek, addDays } from 'date-fns'

export function CalendarView() {
  const [events, setEvents] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [view, setView] = useState<'week' | 'month'>('week')
  
  useEffect(() => {
    // Fetch from unified API
    fetch('/api/calendar/unified').then(res => res.json()).then(data => {
      setEvents(data.gcalEvents || [])
      setTasks(data.tasks || [])
    })
  }, [])
  
  // Render calendar grid with events + tasks
}
```

**Step 2: Add toggle to Kanban page**

In kanban/page.tsx, add:
- Toggle button: [Kanban | Calendar]
- CalendarView component when calendar selected

**Step 3: Commit**

```bash
git add components/calendar/ app/kanban/
git commit -m "feat: add calendar view to existing kanban"
```

---

## Task 2: Unified Calendar API

**Files:**
- Create: `mission-control/app/api/calendar/unified/route.ts`

**Step 1: Create unified endpoint**

```typescript
// app/api/calendar/unified/route.ts
import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/googleCalendar'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  
  // Google Calendar events
  let gcalEvents = []
  try {
    gcalEvents = await getEvents(timeMin, timeMax)
  } catch (e) {
    console.log('GCal not connected')
  }
  
  // Supabase tasks with due dates
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

**Step 2: Add Google Calendar lib**

Create `lib/googleCalendar.ts`:
- OAuth2 flow for Google Calendar
- getEvents() function

**Step 3: Commit**

```bash
git add lib/googleCalendar.ts app/api/calendar/
git commit -m "feat: unified calendar API (GCal + Tasks)"
```

---

## Task 3: Telegram Natural Language Input

**Files:**
- Create: `mission-control/lib/telegramBot.ts`
- Create: `mission-control/app/api/telegram/webhook/route.ts`

**Step 1: Create Telegram bot utility**

```typescript
// lib/telegramBot.ts
import TelegramBot from 'node-telegram-bot-api'

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false })

export function setupWebhook(appUrl: string) {
  bot.setWebHook(`${appUrl}/api/telegram/webhook`)
}

export async function handleMessage(msg: any) {
  const text = msg.text
  const chatId = msg.chat.id
  
  // Parse NL → task/event/note
  const parsed = parseNaturalLanguage(text)
  
  // Save to Supabase
  const supabase = createClient()
  
  if (parsed.type === 'task') {
    await supabase.from('tasks').insert({...})
    await bot.sendMessage(chatId, `✅ Task added: "${parsed.title}"`)
  } else if (parsed.type === 'event') {
    // Create GCal event or store locally
    await bot.sendMessage(chatId, `📅 Event created: "${parsed.title}"`)
  } else if (parsed.type === 'note') {
    await supabase.from('notes').insert({...})
    await bot.sendMessage(chatId, `📝 Note saved: "${parsed.title}"`)
  }
}

function parseNaturalLanguage(text: string) {
  // "Buy milk due Friday" → { type: 'task', title: 'Buy milk', dueDate: 'Friday' }
  // "Meeting with John tomorrow 3pm" → { type: 'event', title: 'Meeting with John', dateTime: 'tomorrow 3pm' }
  // "Note: ideas" → { type: 'note', title: 'ideas' }
  
  const lower = text.toLowerCase()
  
  if (lower.startsWith('note:')) {
    return { type: 'note', title: text.substring(5).trim() }
  }
  
  // Date patterns
  const dueMatch = text.match(/due (.+)/i)
  if (dueMatch) {
    return { 
      type: 'task', 
      title: text.replace(/due .+/i, '').trim(),
      dueDate: dueMatch[1]
    }
  }
  
  // Time patterns (3pm, 3:00pm, etc)
  if (/\d{1,2}:\d{2}\s*(am|pm)?/i.test(text)) {
    return { type: 'event', title: text, dateTime: text }
  }
  
  // Default to task
  return { type: 'task', title: text }
}
```

**Step 2: Create webhook handler**

```typescript
// app/api/telegram/webhook/route.ts
import { NextResponse } from 'next/server'
import { handleMessage } from '@/lib/telegramBot'

export async function POST(request: Request) {
  const body = await request.json()
  
  if (body.message) {
    await handleMessage(body.message)
  }
  
  return NextResponse.json({ ok: true })
}
```

**Step 3: Commit**

```bash
git add lib/telegramBot.ts app/api/telegram/
git commit -m "feat: Telegram bot for NL input"
```

---

## Task 4: Enhanced Activity + Work Tracking

**Files:**
- Modify: `mission-control/app/activity/page.tsx`

**Step 1: Add tabs to Activity page**

```tsx
// Tabs: [Task Events] [Agent Runs]
const [tab, setTab] = useState<'tasks' | 'agent'>('tasks')
```

**Step 2: Add Agent Runs section**

Fetch from `agent_runs` table:
- What Sara automated today
- Tasks completed by agent
- System events

**Step 3: Commit**

```bash
git add app/activity/
git commit -m "feat: add agent runs tracking to activity"
```

---

## Task 5: Notes (Notion Alternative)

**Files:**
- Create: `mission-control/app/notes/page.tsx`
- Create: `mission-control/app/api/notes/route.ts`
- Create: `mission-control/app/api/notes/[id]/route.ts`

**Step 1: Create notes table in Supabase**

```sql
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Step 2: Create notes API**

- GET /api/notes - list all
- POST /api/notes - create
- PUT /api/notes/[id] - update
- DELETE /api/notes/[id] - delete

**Step 3: Create notes page**

Features:
- Two-column: Notes list + Editor
- Tags filtering
- Full-text search
- Markdown support

**Step 4: Add to sidebar**

In sidebar.tsx, add:
```tsx
{ href: '/notes', label: 'Notes', icon: FileText },
```

**Step 5: Commit**

```bash
git add app/notes/ app/api/notes/ components/sidebar.tsx
git commit -m "feat: add notes (Notion alternative)"
```

---

## Task 6: Enhanced Morning Brief

**Files:**
- Modify: `mission-control/app/page.tsx`

**Step 1: Pull all data sources**

```tsx
// In fetchData():
// 1. Google Calendar events (today)
// 2. Tasks due today
// 3. Agent runs (yesterday)
// 4. Notes with "brief" tag
```

**Step 2: Show Sara's automated work**

- "Sara completed X tasks yesterday"
- "Sara is working on Y today"
- "Upcoming: Z meetings"

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: enhanced morning brief with all data"
```

---

## Task 7: Natural Language Quick Add (Global)

**Files:**
- Create: `mission-control/components/QuickAdd.tsx`

**Step 1: Create floating action button**

- Fixed bottom-right
- Opens modal for NL input
- Same parser as Telegram bot

**Step 2: Commit**

```bash
git add components/QuickAdd.tsx app/layout.tsx
git commit -m "feat: global quick-add for tasks/events/notes"
```

---

## Summary

| Task | Feature | Integrate Into |
|------|---------|----------------|
| 1 | Calendar View | /kanban (toggle) |
| 2 | Unified API | Backend |
| 3 | Telegram Input | Backend + Telegram |
| 4 | Work Tracking | /activity (tab) |
| 5 | Notes | NEW /notes + sidebar |
| 6 | Morning Brief | / (enhanced) |
| 7 | Quick Add | Global FAB |

---

**Two execution options:**

1. **Subagent-Driven (this session)** - Fresh subagent per task, fast iteration

2. **Parallel Session (separate)** - Batch execution with checkpoints

**Which approach?**
