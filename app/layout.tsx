"use client"
import type React from "react"
import "./globals.css"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"
import { JetBrains_Mono } from "next/font/google"
import { AuthProvider } from "@/hooks/useAuth"

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata = {
  title: "OSINT MASTERS",
  description: "Studenckie kółko naukowe OSINT Masters"
}

interface Poll {
  id: number
  active: boolean
  expires_at?: string
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const [activeVotes, setActiveVotes] = useState(0)

  useEffect(() => {
    const fetchActiveVotes = async () => {
      try {
        const response = await api.get<{ polls: Poll[] }>("/api/votes/active")
        const activePollsCount = response.data.polls.filter(poll => 
          poll.active && (!poll.expires_at || new Date(poll.expires_at) > new Date())
        ).length
        setActiveVotes(activePollsCount)
      } catch (err) {
        console.error("Failed to fetch active votes count:", err)
        setActiveVotes(0)
      }
    }

    fetchActiveVotes()
    // Poll for active votes every minute
    const interval = setInterval(fetchActiveVotes, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl glitch">Loading...</div>
      </div>
    )
  }

  return (
    <html lang="pl">
      <body className={jetbrainsMono.className}>
        <AuthProvider>
          <div className="scanline"></div>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'
import { useEffect } from "react"

import { useState } from "react"

