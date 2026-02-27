// Google Calendar Integration
// To enable: Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI to .env.local

// Placeholder for Google Calendar API
// When credentials are added, this will fetch real events

export interface CalendarEvent {
  id: string
  summary?: string
  description?: string
  start?: {
    dateTime?: string
    date?: string
  }
  end?: {
    dateTime?: string
    date?: string
  }
}

export async function getEvents(_timeMin: string, _timeMax: string): Promise<CalendarEvent[]> {
  // Google Calendar integration not yet configured
  // To enable: 
  // 1. Add credentials to .env.local
  // 2. Implement OAuth flow
  // 3. Uncomment below
  
  /*
  import { google } from 'googleapis'
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  
  // Check for stored tokens
  // If not found, return OAuth URL
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  })
  
  return response.data.items || []
  */
  
  console.log('Google Calendar not configured - using local tasks only')
  return []
}

export function getAuthUrl(): string {
  // Return OAuth URL when ready
  return 'https://console.cloud.google.com/apis/credentials'
}
