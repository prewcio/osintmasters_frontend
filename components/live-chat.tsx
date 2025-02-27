"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { configureAbly, useChannel, usePresence } from "@ably-labs/react-hooks"
import { useAuth } from "@/hooks/useAuth"
import AnimatedButton from "./animated-button"
import api from "@/lib/axios"
import { CHAT_CHANNEL } from "@/lib/ably"
import type { Types } from 'ably'
import Ably from "ably/promises"
import { NextResponse } from "next/server"

interface Message {
  id: number
  content: string
  sender: {
    id: number
    name: string
  }
  created_at: string
}

type AblyMessage = Types.Message & {
  data: {
    content: string
    user: {
      id: number
      name: string
    }
  }
}

// Configure Ably client
const configureAblyClient = async () => {
  const clientId = Math.random().toString(36).substring(2, 15);
  
  return {
    authUrl: `/api/ably/auth`,
    authMethod: 'POST',
    authHeaders: {
      'Content-Type': 'application/json',
    },
    authParams: {
      clientId,
    },
    clientId,
    useBinaryProtocol: false,
    echoMessages: false,
    recover: function(_lastConnectionDetails: unknown, cb: (shouldRecover: boolean) => void) {
      cb(false); // Don't recover
    },
  };
};

export default function LiveChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/chat")
      if (!response.ok) throw new Error("Failed to fetch messages")
      const data = await response.json()
      setMessages(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching messages:", err)
      setError("Nie udało się załadować wiadomości")
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      const message = await response.json()
      setMessages([...messages, message])
      setNewMessage("")
      setError(null)
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Nie udało się wysłać wiadomości")
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Zaloguj się, aby korzystać z czatu</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-black/50 rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-gray-800">
        <h2 className="text-sm sm:text-base font-medium">Live Chat</h2>
        <span className="text-xs sm:text-sm text-green-500">Online</span>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#39FF14]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500 text-sm sm:text-base">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm sm:text-base">Brak wiadomości</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.sender.id === user.id ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-lg p-3 ${
                  message.sender.id === user.id
                    ? "bg-[#39FF14]/10 text-[#39FF14]"
                    : "bg-gray-800 text-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-xs sm:text-sm">
                    {message.sender.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(message.created_at)}
                  </span>
                </div>
                <p className="text-sm sm:text-base break-words">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Napisz wiadomość..."
            className="flex-1 bg-black border border-gray-800 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:border-[#39FF14] transition-colors"
          />
          <AnimatedButton
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 text-sm sm:text-base"
          >
            Wyślij
          </AnimatedButton>
        </div>
      </form>
    </div>
  )
}

export async function GET(request: Request) {
  try {
    const response = await api.get("/api/chat/messages");
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const token = request.headers.get("Authorization")?.split(" ")[1];

    const response = await api.post("/api/chat/messages", data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

