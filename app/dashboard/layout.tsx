"use client"

import { redirect } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import api from "@/lib/axios"
import Navbar from "@/components/navbar"

interface Poll {
  id: number
  active: boolean
  expires_at?: string
}

export default function DashboardLayout({
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

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar activeVotes={activeVotes} />
      <main className="container mx-auto px-4 py-6 md:py-8 animate-fadeIn">{children}</main>
    </div>
  )
}

