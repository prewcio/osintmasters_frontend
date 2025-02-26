"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"

interface Poll {
  id: number
  title: string
  description: string
  questions: Array<{
    question: string
    type: "single" | "multiple" | "text" | "scale"
  }>
  active: boolean
  created_at: string
  expires_at?: string
  is_system_post?: boolean
  total_votes: number
  has_voted?: boolean
}

export default function Ankiety() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "system">("all")
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true)
        const response = await api.get<{ polls: Poll[] }>("/api/votes/active")
        setPolls(response.data.polls)
      } catch (err) {
        console.error("Failed to fetch polls:", err)
        setError("Nie udało się załadować ankiet. Spróbuj ponownie później.")
      } finally {
        setLoading(false)
      }
    }

    fetchPolls()
  }, [])

  if (!user) {
    router.push("/login")
    return null
  }

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poll.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const now = new Date()
    const isExpired = poll.expires_at && new Date(poll.expires_at) < now
    
    switch (filter) {
      case "active":
        return matchesSearch && poll.active && !isExpired
      case "expired":
        return matchesSearch && isExpired
      case "system":
        return matchesSearch && poll.is_system_post
      default:
        return matchesSearch
    }
  })

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 glitch text-center">ANKIETY</h1>

        <div className="mb-6 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Szukaj ankiet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-gray-800 p-3 pl-10 focus:border-[#39FF14] focus:outline-none transition-colors"
            />
            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          </div>

          {/* Filters */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 border ${
                filter === "all"
                  ? "border-[#39FF14] text-[#39FF14]"
                  : "border-gray-800 text-gray-400 hover:border-[#39FF14] hover:text-[#39FF14]"
              } transition-colors`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 border ${
                filter === "active"
                  ? "border-[#39FF14] text-[#39FF14]"
                  : "border-gray-800 text-gray-400 hover:border-[#39FF14] hover:text-[#39FF14]"
              } transition-colors`}
            >
              Aktywne
            </button>
            <button
              onClick={() => setFilter("expired")}
              className={`px-4 py-2 border ${
                filter === "expired"
                  ? "border-[#39FF14] text-[#39FF14]"
                  : "border-gray-800 text-gray-400 hover:border-[#39FF14] hover:text-[#39FF14]"
              } transition-colors`}
            >
              Wygasłe
            </button>
            <button
              onClick={() => setFilter("system")}
              className={`px-4 py-2 border ${
                filter === "system"
                  ? "border-[#39FF14] text-[#39FF14]"
                  : "border-gray-800 text-gray-400 hover:border-[#39FF14] hover:text-[#39FF14]"
              } transition-colors`}
            >
              Systemowe
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center">Ładowanie...</div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : filteredPolls.length === 0 ? (
            <p className="text-center text-gray-400">
              {searchQuery
                ? "Nie znaleziono ankiet spełniających kryteria wyszukiwania"
                : "Brak dostępnych ankiet"}
            </p>
          ) : (
            filteredPolls.map((poll) => (
              <div key={poll.id} className="neon-box p-6">
                {poll.is_system_post && (
                  <div className="mb-2">
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Post systemowy
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{poll.title}</h3>
                <p className="text-gray-300 mb-4">{poll.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                  <p>
                    Utworzono: {new Date(poll.created_at).toLocaleString("pl-PL")}
                  </p>
                  {poll.expires_at && (
                    <p>
                      Wygasa: {new Date(poll.expires_at).toLocaleString("pl-PL")}
                    </p>
                  )}
                  <p>Liczba pytań: {poll.questions.length}</p>
                  <p>Oddanych głosów: {poll.total_votes}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="space-x-2">
                    {poll.has_voted ? (
                      <span className="text-green-500">✓ Oddano głos</span>
                    ) : (
                      <span className="text-yellow-500">Nie oddano głosu</span>
                    )}
                  </div>
                  <AnimatedButton
                    onClick={() => router.push(
                      poll.has_voted 
                        ? `/dashboard/vote-results/${poll.id}`
                        : `/dashboard/vote/${poll.id}`
                    )}
                    disabled={!poll.active || (poll.expires_at && new Date(poll.expires_at) < new Date())}
                  >
                    {poll.has_voted ? "Zobacz odpowiedzi" : "Zagłosuj"}
                  </AnimatedButton>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  )
}

