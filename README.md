# Mission Control - Babak + Sara

Mission Control is your AI-powered project management system. It's designed to be your central hub for work, managed proactively by Sara.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Supabase Project (Free Tier works great)

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup (Supabase)
1. Go to your Supabase Dashboard -> SQL Editor.
2. Copy the contents of `supabase/schema.sql`.
3. Run the SQL query to create tables, functions, and initial seed data.

### 4. Running the App
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Initial Seed (Optional)
If projects were not created by the SQL script:
1. Navigate to `/admin` in your browser.
2. Click "Seed Initial Data" to ensure default projects (FAMCO, Mekanik, etc.) exist.

## 🛠 Features

### Projects & Kanban
- Navigate to **Projects** to see all active workstreams.
- Click a project to view its **Kanban Board**.
- Drag and drop tasks to update status instantly.
- Sara automatically moves tasks based on chat context (via API).

### Daily Brief
- The **Dashboard** shows your morning brief:
    - High priority tasks.
    - Tasks currently in "Doing".
    - Recent activity from Sara.

### Agent API
- Endpoint: `POST /api/agent-task`
- Body: `{ "prompt": "Follow up with designer for Mekanik" }`
- Use this to feed tasks from Telegram/Chat directly into Mission Control.

## 🤖 Sara's Operating Rules
- **Proactive:** Sara moves tasks without asking if the context is clear.
- **Transparent:** Every action is logged in the Activity Feed.
- **Organized:** Unclear tasks go to "Unsorted / Inbox" for review.

## Tech Stack
- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (Postgres + Realtime)
- dnd-kit (Kanban)
