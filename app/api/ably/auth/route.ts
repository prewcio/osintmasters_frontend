import Ably from "ably/promises"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  if (!process.env.ABLY_API_KEY) {
    return NextResponse.json(
      { error: "Missing Ably API key" }, 
      { status: 500 }
    )
  }

  try {
    const client = new Ably.Rest(process.env.ABLY_API_KEY)
    const { clientId } = await request.json()

    const tokenRequestData = await client.auth.createTokenRequest({
      clientId: clientId || undefined
    })

    return NextResponse.json(tokenRequestData)
  } catch (error) {
    console.error('Error creating Ably token request:', error)
    return NextResponse.json(
      { error: "Failed to create Ably token request" },
      { status: 500 }
    )
  }
} 