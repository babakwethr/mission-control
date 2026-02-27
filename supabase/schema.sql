-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects Table
create table projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  status text default 'active', -- active, archived
  created_at timestamptz default now()
);

-- Columns Table (Kanban Stages)
create table columns (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  position integer not null,
  created_at timestamptz default now(),
  unique(project_id, name)
);

-- Tasks Table
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  column_id uuid references columns(id) on delete set null,
  title text not null,
  description text,
  priority text default 'Medium', -- Low, Medium, High
  due_date timestamptz,
  assignee text default 'Unassigned', -- Babak, Sara
  tags text[],
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Task Events (Activity Log)
create table task_events (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  actor text not null, -- Babak, Sara, System
  event_type text not null, -- created, moved, updated, completed, note
  details text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Agent Runs (Daily Summaries + Plans)
create table agent_runs (
  id uuid primary key default uuid_generate_v4(),
  run_type text not null, -- morning_brief, evening_summary, periodic_check
  summary text,
  plan text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Insert Default Projects (Initial Seed)
insert into projects (name, description) values
('FAMCO Connect', 'Industrial Sales Automation'),
('Investor Concierge', 'Micro-SaaS Product'),
('Mekanik.ai', 'AI Engineering Tool Product'),
('Mosaic Tiles', 'New Project'),
('Unsorted / Inbox', 'Default project for unclassified tasks')
on conflict (name) do nothing;
