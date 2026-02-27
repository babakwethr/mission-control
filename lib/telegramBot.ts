// Telegram Bot for Mission Control
// Natural Language Input: tasks, events, notes

// Only import on server-side to avoid build errors
let TelegramBot: any = null
let bot: any = null

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8586701093:AAEAnW_jSkpjM7-UXSZNefMeXCPjOpedrEU'

// Initialize bot lazily (only when actually used)
function getBot() {
  if (typeof window !== 'undefined') return null // Browser - don't initialize
  if (!bot) {
    try {
      // Dynamic import to avoid build errors
      const module = require('node-telegram-bot-api')
      TelegramBot = module.default || module
      bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { webhook: true })
    } catch (e) {
      console.log('Telegram bot not available:', e)
    }
  }
  return bot
}

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gpodwzygslwewlzguqdm.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

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
    { regex: /(.+?)\s+(on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i, dateGroup: 3, titleGroup: 1 },
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
  
  // Event patterns
  if (/\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i.test(text)) {
    return { type: 'event', title: text, dateTime: text }
  }
  
  // Priority prefixes
  if (lower.startsWith('urgent') || lower.startsWith('high!')) {
    return { type: 'task', title: text.replace(/^(urgent|high!)[:\!]\s*/i, '').trim(), priority: 'High' }
  }
  
  // Default: treat as task
  return { type: 'task', title: text, priority: 'Medium' }
}

export async function handleTelegramMessage(msg: any): Promise<string> {
  // Skip if no Supabase configured
  if (!supabaseUrl || !supabaseKey) {
    return 'Supabase not configured'
  }
  
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const chatId = msg.chat?.id
  const text = msg.text
  
  if (!text || text.startsWith('/')) {
    return 'Ignoring command messages'
  }
  
  // Parse the input
  const parsed = parseNaturalLanguage(text)
  
  try {
    switch (parsed.type) {
      case 'task': {
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
        const { error } = await supabase.from('tasks').insert({
          title: `📅 ${parsed.title}`,
          priority: 'Medium',
          due_date: parsed.dateTime || null,
          assignee: 'telegram',
          tags: ['event', 'from-telegram']
        })
        
        if (error) throw error
        
        return `📅 Event noted: "${parsed.title}"`
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
