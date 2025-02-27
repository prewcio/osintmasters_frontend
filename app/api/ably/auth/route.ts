import Ably from "ably/promises"
import { NextResponse } from "next/server"
import { headers } from 'next/headers'

async function handleAblyAuth(request: Request) {
  if (!process.env.ABLY_API_KEY) {
    return NextResponse.json({ error: "Ably API key not configured" }, { status: 500 })
  }

  const client = new Ably.Rest({
    key: process.env.ABLY_API_KEY,
    environment: 'production',
    useBinaryProtocol: false
  })

  let clientId: string | null = null

  // Handle both GET and POST methods
  if (request.method === 'GET') {
    clientId = new URL(request.url).searchParams.get("clientId")
  } else if (request.method === 'POST') {
    try {
      const body = await request.json()
      clientId = body.clientId
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
  }

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 })
  }

  try {
    const tokenRequest = await client.auth.createTokenRequest({
      clientId,
      capability: {
        "*": ["publish", "subscribe", "presence"]
      }
    })

    // Set CORS headers
    const headersList = headers()
    const origin = headersList.get("origin") || "*"
    
    return new NextResponse(JSON.stringify(tokenRequest), {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Error creating Ably token request:", error)
    return NextResponse.json(
      { error: "Error creating token request" },
      { status: 500 }
    )
  }
}

export const GET = handleAblyAuth
export const POST = handleAblyAuth

// Add OPTIONS handler for CORS
export async function OPTIONS(request: Request) {
  const headersList = headers()
  const origin = headersList.get("origin") || "*"

  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
} 