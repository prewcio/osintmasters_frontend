import Ably from "ably/promises"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const client = new Ably.Rest(process.env.ABLY_API_KEY!)
  const clientId = new URL(request.url).searchParams.get("clientId")

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