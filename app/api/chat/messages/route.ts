import { NextResponse } from "next/server"
import { ably } from "@/lib/ably"
import { CHAT_CHANNEL } from "@/lib/ably"
import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.49:8000",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
})

// In a real app, you would use a database
let messages: any[] = []

export async function GET(request: Request) {
  try {
    const response = await api.get("/api/chat/messages")
    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const token = request.headers.get("Authorization")?.split(" ")[1]

    const response = await api.post("/api/chat/messages", data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Failed to send message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
} 