"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import Countdown from "@/components/countdown"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"

type Meeting = {
  id: number
  title: string
  description: string
  date: string
  location: string
  link?: string
  created_at: string
  creator?: {
    id: number
    name: string
  }
}

type PaginatedResponse<T> = {
  current_page: number
  data: T[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true)
        const response = await api.get<PaginatedResponse<Meeting>>("/api/meetings")
        setMeetings(response.data.data || [])
      } catch (err) {
        console.error("Failed to fetch meetings:", err)
        setError("Nie udało się załadować spotkań. Spróbuj ponownie później.")
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [])

  // Ensure user is authenticated
  if (!user) {
    window.location.href = "/login"
    return null
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="text-center">Ładowanie...</div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      </PageTransition>
    )
  }

  const now = new Date()
  const upcomingMeetings = meetings
    .filter(meeting => new Date(meeting.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  const pastMeetings = meetings
    .filter(meeting => new Date(meeting.date) <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 glitch text-center">SPOTKANIA</h1>

        <div className="space-y-8">
          {/* Upcoming Meetings */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Nadchodzące spotkania</h2>
            <div className="space-y-4">
              {upcomingMeetings.length === 0 ? (
                <p className="text-center text-gray-400">Brak nadchodzących spotkań</p>
              ) : (
                upcomingMeetings.map(meeting => {
                  const meetingDate = new Date(meeting.date)

                  return (
                    <Link
                      key={meeting.id}
                      href={`/dashboard/meetings/${meeting.id}`}
                      className="block neon-box p-4 hover:border-[#39FF14] transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{meeting.title}</h3>
                          <p className="text-gray-300 line-clamp-2 mb-2">{meeting.description}</p>
                          <p className="text-sm text-gray-400">
                            Lokalizacja: {meeting.location}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-400">Za: </span>
                            <Countdown targetDate={meetingDate} className="text-[#39FF14]" />
                          </p>
                        </div>
                        {meeting.link && (
                          <a
                            href={meeting.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block bg-black text-white border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-4 py-2 text-sm"
                          >
                            Dołącz
                          </a>
                        )}
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {/* Past Meetings */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Poprzednie spotkania</h2>
            <div className="space-y-4">
              {pastMeetings.length === 0 ? (
                <p className="text-center text-gray-400">Brak poprzednich spotkań</p>
              ) : (
                pastMeetings.map(meeting => {
                  const meetingDate = new Date(meeting.date)
                  const daysAgo = Math.round((now.getTime() - meetingDate.getTime()) / (1000 * 60 * 60 * 24))

                  return (
                    <Link
                      key={meeting.id}
                      href={`/dashboard/meetings/${meeting.id}`}
                      className="block neon-box p-4 opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <h3 className="text-lg font-semibold mb-2">{meeting.title}</h3>
                      <p className="text-gray-300 line-clamp-2 mb-2">{meeting.description}</p>
                      <p className="text-sm text-gray-400">
                        Lokalizacja: {meeting.location}
                      </p>
                      <p className="text-sm text-gray-400">
                        {daysAgo === 0
                          ? "Dzisiaj"
                          : daysAgo === 1
                          ? "Wczoraj"
                          : `${daysAgo} dni temu`}
                      </p>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 