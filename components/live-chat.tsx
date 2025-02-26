"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Pusher from "pusher-js"
import { useAuth } from "@/hooks/useAuth"
import AnimatedButton from "./animated-button"
import api from "@/lib/axios"

type Message = {
  id: number
  user: { id: number; name: string }
  content: string
  created_at: string
}

export default function LiveChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const channel = pusher.subscribe("chat")
    channel.bind("new-message", (data: Message) => {
      console.log("New message received:", data);
      setMessages((prevMessages) => [...prevMessages, data])
    })

    fetchMessages()

    return () => {
      pusher.unsubscribe("chat")
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await api.get<Message[]>("/api/messages")
      setMessages(response.data)
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && user) {
      try {
        const messageData = {
          content: newMessage,
          userId: user.id,
        };

        console.log("Sending message to Pusher:", messageData);

        const response = await api.post("/api/messages", messageData);
        console.log("Message sent successfully:", response.data);

        console.log("Pusher Key:", process.env.NEXT_PUBLIC_PUSHER_KEY);
        console.log("Pusher Cluster:", process.env.NEXT_PUBLIC_PUSHER_CLUSTER);

        setNewMessage("");
        fetchMessages();
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      console.warn("Message is empty or user is not authenticated.");
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="neon-box p-4 h-[calc(100vh-200px)] flex flex-col">
      <h2 className="text-xl mb-4">Live Chat</h2>
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-2 flex items-center">
            <span className="text-gray-500 text-xs mr-2">{new Date(message.created_at).toLocaleString()}</span>
            <span className="font-bold">{message.user.name}: </span>
            <span>{message.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow bg-black border border-gray-800 p-2 mr-2"
          placeholder="Wpisz wiadomość..."
        />
        <AnimatedButton type="submit">Wyślij</AnimatedButton>
      </form>
    </div>
  )
}

