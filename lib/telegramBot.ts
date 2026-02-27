// Telegram Bot for Mission Control
// Natural Language Input: tasks, events, notes

import TelegramBot from 'node-telegram-bot-api'
import { createClient } from '@supabase/supabase-js'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8586701093:AAEAnW_jSkpjM7-UXSZNefMeXCPjOpedrEU'

// Initialize bot with webhook mode (more reliable)
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { webhook: true })

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface ParsedInput {
  type: 'task' | 'event' | 'note' | 'unknown'
  title: string
  dueDate?: string
  dateTime?: string
  priority?: string
  projectId?: string
  tags?: string[]
}

export function parseNaturalLanguage(text: string): ParsedInput {
  const lower = text.toLowerCase().trim()
  
  // Note: "note: ideas" or "note - ideas"
  if (lower.startsWith('note:') || lower.startsWith('note -') || lower.startsWith('note ')) {
    const title = text.replace(/^note[:\-]?\s*/i, '').trim()
    return { type: 'note', title: title || 'Untitled Note', tags: ['telegram'] }
  }
  
  // Task patterns: "buy milk due Friday", "finish report by tomorrow", "urgent: call mom"
  const duePatterns = [
    { regex: /(.+?)\s+due\s+(.+)/i, dateGroup: 2, titleGroup: 1 },
    { regex: /(.+?)\s+by\s+(.+)/i, dateGroup: 2, titleGroup: 1 },
    { regex: /(.+?)\s+on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, dateGroup: 2, titleGroup: 1 },
  ]
  
  for (const pattern of duePatterns) {
    const match = text.match(pattern.regex)
    if (match) {
      const priority = lower.startsWith('urgent') || lower.startsWith('high!') ? 'High' : 
                       lower.startsWith('low') ? 'Low' : 'Medium'
      const title = match[pattern.titleGroup].replace(/^(urgent|high|low)[:\!]\s*/i, '').trim()
      
      return {
        type: 'task',
        title,
        dueDate: match[pattern.dateGroup],
        priority
      }
    }
  }
  
  // Event patterns: "meeting at 3pm", "call john tomorrow at 2pm", "lunch at noon"
  const eventPatterns = [
    { regex: /(.+?)\s+(at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i },
    { regex: /(.+?)\s+(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i },
  ]
  
  for (const pattern of eventPatterns) {
    const match = text.match(pattern.regex)
    if (match) {
      return {
        type: 'event',
        title: match[1].trim(),
        dateTime: match[2].trim()
      }
    }
  }
  
  // Priority prefixes
  if (lower.startsWith('urgent') || lower.startsWith('high!')) {
    return { type: 'task', title: text.replace(/^(urgent|high!)[:\!]\s*/i, '').trim(), priority: 'High' }
  }
  
  // Default: treat as task
  return { type: 'task', title: text, priority: 'Medium' }
}

export async function handleTelegramMessage(msg: any): Promise<string> {
  const chatId = msg.chat.id
  const text = msg.text
  
  if (!text || text.startsWith('/')) {
    return 'Ignoring command messages'
  }
  
  // Parse the input
  const parsed = parseNaturalLanguage(text)
  
  try {
    switch (parsed.type) {
      case 'task': {
        // Find default project or create task without project
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('status', 'active')
          .limit(1)
        
        const projectId = projects?.[0]?.id || null
        
        const { error } = await supabase.from('tasks').insert({
          title: parsed.title,
          priority: parsed.priority || 'Medium',
          due_date: parsed.dueDate || null,
          project_id: projectId,
          assignee: 'telegram',
          tags: ['from-telegram']
        })
        
        if (error) throw error
        
        return `✅ Task added: "${parsed.title}"${parsed.priority === 'High' ? ' (High Priority)' : ''}${parsed.dueDate ? ` due ${parsed.dueDate}` : ''}`
      }
      
      case 'note': {
        const { error } = await supabase.from('notes').insert({
          title: parsed.title,
          content: '',
          tags: parsed.tags || ['telegram']
        })
        
        if (error) throw error
        
        return `📝 Note saved: "${parsed.title}"`
      }
      
      case 'event': {
        // For now, create a task with event info - full GCal integration later
        const { error } = await supabase.from('tasks').insert({
          title: `📅 ${parsed.title}`,
          priority: 'Medium',
          due_date: parsed.dateTime || null,
          assignee: 'telegram',
          tags: ['event', 'from-telegram']
        })
        
        if (error) throw error
        
        return `📅 Event noted: "${parsed.title}" at ${parsed.dateTime}`
      }
      
      default:
        return `❓ Didn't understand: "${text}". Try "task due Friday" or "note: ideas"`
    }
  } catch (error) {
    console.error('Telegram handler error:', error)
    return `❌ Error processing: "${text}"`
  }
}

export { bot }
