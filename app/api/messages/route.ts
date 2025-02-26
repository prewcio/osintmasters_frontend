import { NextResponse } from "next/server"
import Pusher from "pusher"

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(request: Request) {
  const { content, userId } = await request.json()

  // Here you would typically save the message to your database
  // For this example, we'll just simulate it
  const message = {
    id: Date.now(),
    user: `User ${userId}`, // In a real app, you'd fetch the user's name
    content,
    timestamp: new Date().toISOString(),
  }

  // Trigger the new message event
  await pusher.trigger("chat", "new-message", message)

  return NextResponse.json({ message: "Message sent" })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number.parseInt(searchParams.get("limit") || "100", 10)

  // Here you would typically fetch messages from your database
  // For this example, we'll just return some mock data
  const messages = [
    {
      id: 1,
      user: "System",
      content: "Welcome to the chat!",
      timestamp: new Date().toISOString(),
    },
    {
      id: 2,
      user: "User 1",
      content: "Hello everyone!",
      timestamp: new Date().toISOString(),
    },
    {
      id: 3,
      user: "User 2",
      content: "Hi there!",
      timestamp: new Date().toISOString(),
    },
    {
      id: 4,
      user: "User 3",
      content: "How's it going?",
      timestamp: new Date().toISOString(),
    },
  ]

  return NextResponse.json(messages.slice(-limit))
}

