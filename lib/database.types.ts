export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: string
          created_at?: string
        }
      }
      columns: {
        Row: {
          id: string
          project_id: string
          name: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          position: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          position?: number
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          column_id: string | null
          title: string
          description: string | null
          priority: string
          due_date: string | null
          assignee: string
          tags: string[] | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          column_id?: string | null
          title: string
          description?: string | null
          priority?: string
          due_date?: string | null
          assignee?: string
          tags?: string[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          column_id?: string | null
          title?: string
          description?: string | null
          priority?: string
          due_date?: string | null
          assignee?: string
          tags?: string[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      task_events: {
        Row: {
          id: string
          task_id: string
          actor: string
          event_type: string
          details: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          actor: string
          event_type: string
          details?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          actor?: string
          event_type?: string
          details?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      agent_runs: {
        Row: {
          id: string
          run_type: string
          summary: string | null
          plan: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          run_type: string
          summary?: string | null
          plan?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          run_type?: string
          summary?: string | null
          plan?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
  }
}
