"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { configureAbly, useChannel, usePresence } from "@ably-labs/react-hooks"
import { useAuth } from "@/hooks/useAuth"
import AnimatedButton from "./animated-button"
import api from "@/lib/axios"
import { CHAT_CHANNEL } from "@/lib/ably"
import type { Types } from 'ably'

type Message = {
  id: number
  user: { id: number; name: string }
  content: string
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
configureAbly({
  authUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/ably/auth`,
  clientId: Math.random().toString(36).substring(2, 15)
})

export default function LiveChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [memberCount, setMemberCount] = useState(0)

  // Subscribe to Ably channel
  const [channel] = useChannel(CHAT_CHANNEL, (message) => {
    const ablyMessage = message as AblyMessage
    const newMessage: Message = {
      id: Date.now(), // Use timestamp as temporary ID
      user: ablyMessage.data.user,
      content: ablyMessage.data.content,
      created_at: new Date(ablyMessage.timestamp).toISOString()
    }
    setMessages(prev => [...prev, newMessage])
  })

  // Track presence
  const [presenceData] = usePresence(CHAT_CHANNEL, {
    user: user ? { id: user.id, name: user.name } : null
  })

  useEffect(() => {
    if (presenceData) {
      setMemberCount(presenceData.length)
    }
  }, [presenceData])

  useEffect(() => {
    if (user) {
      fetchMessages()
    }
  }, [user])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await api.get<Message[]>("/api/chat/messages")
      setMessages(response.data)
      scrollToBottom()
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim()) return

    try {
      // Store in backend first
      const response = await api.post<Message>("/api/chat/messages", {
        content: newMessage.trim()
      })

      // Then publish to Ably if backend save was successful
      await channel.publish("message", {
        content: newMessage.trim(),
        user: {
          id: user.id,
          name: user.name
        }
      })

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (!user) {
    return (
      <div className="neon-box p-4 flex items-center justify-center">
        <p>Please log in to access the chat.</p>
      </div>
    )
  }

  return (
    <div className="neon-box p-4 h-[calc(100vh-200px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Live Chat</h2>
        <span className="text-sm text-gray-400">
          {memberCount} {memberCount === 1 ? 'user' : 'users'} online
        </span>
      </div>
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-2 flex items-start ${message.user.id === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${message.user.id === user.id ? 'bg-[#39FF14]/10' : 'bg-gray-800/50'} p-2 rounded`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm">{message.user.name}</span>
                <span className="text-gray-500 text-xs">
                  {new Date(message.created_at).toLocaleString()}
                </span>
              </div>
              <span className="break-words">{message.content}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow bg-black border border-gray-800 p-2 rounded focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-colors outline-none"
          placeholder="Type your message..."
        />
        <AnimatedButton type="submit" disabled={!newMessage.trim()}>
          Send
        </AnimatedButton>
      </form>
    </div>
  )
}

