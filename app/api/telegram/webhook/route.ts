import { NextResponse } from 'next/server'
import { handleTelegramMessage } from '@/lib/telegramBot'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Handle Telegram webhook
    if (body.message) {
      const { message } = body
      const chatId = message.chat.id
      const text = message.text
      
      console.log(`Telegram message from ${chatId}: ${text}`)
      
      // Process the message and get response
      const responseText = await handleTelegramMessage(message)
      
      // Send response back to user
      // Note: In production, you'd use the bot to send back
      // For now, just log it
      console.log('Bot response:', responseText)
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook active' })
}
