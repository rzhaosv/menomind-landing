import crypto from 'crypto'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_TOKEN
const API_VERSION = 'v21.0'

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

interface PurchaseEventParams {
  email?: string
  value: number
  currency?: string
  eventId?: string
  clientIpAddress?: string
  clientUserAgent?: string
  fbc?: string
  fbp?: string
}

export async function sendPurchaseEvent({
  email,
  value,
  currency = 'USD',
  eventId,
  clientIpAddress,
  clientUserAgent,
  fbc,
  fbp,
}: PurchaseEventParams): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('Meta CAPI: Missing PIXEL_ID or ACCESS_TOKEN, skipping server event')
    return
  }

  const userData: Record<string, string> = {}
  if (email) userData.em = sha256(email)
  if (clientIpAddress) userData.client_ip_address = clientIpAddress
  if (clientUserAgent) userData.client_user_agent = clientUserAgent
  if (fbc) userData.fbc = fbc
  if (fbp) userData.fbp = fbp

  const eventData = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId || crypto.randomUUID(),
        event_source_url: 'https://menomind.app/success',
        action_source: 'website',
        user_data: userData,
        custom_data: {
          value,
          currency,
        },
      },
    ],
  }

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('Meta CAPI: Failed to send Purchase event', { status: response.status, body })
      return
    }

    const result = await response.json()
    console.log('Meta CAPI: Purchase event sent', { events_received: result.events_received })
  } catch (error) {
    console.error('Meta CAPI: Error sending Purchase event', error)
  }
}
