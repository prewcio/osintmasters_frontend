import Ably from "ably/promises"
import { NextResponse } from "next/server"

async function handleAblyAuth(request: Request) {
  if (!process.env.ABLY_API_KEY) {
    return NextResponse.json({ error: "Ably API key not configured" }, { status: 500 })
  }

  const client = new Ably.Rest(process.env.ABLY_API_KEY)
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
    const tokenRequest = await client.auth.createTokenRequest({ clientId })
    return NextResponse.json(tokenRequest)
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