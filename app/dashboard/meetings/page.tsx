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

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true)
        const response = await api.get<Meeting[]>("/api/meetings")
        setMeetings(response.data || [])
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
        <div className="container mx-auto px-4 py-8 text-center">Ładowanie...</div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 glitch text-center">SPOTKANIA</h1>

        <div className="space-y-8 md:space-y-12">
          {/* Upcoming Meetings */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Nadchodzące spotkania</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMeetings.length === 0 ? (
                <p className="col-span-full text-center text-gray-400 py-8">Brak nadchodzących spotkań</p>
              ) : (
                upcomingMeetings.map(meeting => {
                  const meetingDate = new Date(meeting.date)

                  return (
                    <Link
                      key={meeting.id}
                      href={`/dashboard/meetings/${meeting.id}`}
                      className="block neon-box p-6 hover:border-[#39FF14] transition-all hover:shadow-lg hover:scale-102 rounded-lg"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold mb-3 line-clamp-2">{meeting.title}</h3>
                          <p className="text-gray-300 line-clamp-3 mb-3">{meeting.description}</p>
                          <p className="text-sm text-gray-400 mb-2">
                            Lokalizacja: {meeting.location}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-400">Za: </span>
                            <Countdown targetDate={meetingDate} className="text-[#39FF14]" />
                          </p>
                        </div>
                        {meeting.link && (
                          <div className="mt-4 text-center">
                            <a
                              href={meeting.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-block w-full bg-black text-white border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-4 py-2 text-sm rounded-md"
                            >
                              Dołącz
                            </a>
                          </div>
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
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Poprzednie spotkania</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastMeetings.length === 0 ? (
                <p className="col-span-full text-center text-gray-400 py-8">Brak poprzednich spotkań</p>
              ) : (
                pastMeetings.map(meeting => {
                  const meetingDate = new Date(meeting.date)
                  const daysAgo = Math.round((now.getTime() - meetingDate.getTime()) / (1000 * 60 * 60 * 24))

                  return (
                    <Link
                      key={meeting.id}
                      href={`/dashboard/meetings/${meeting.id}`}
                      className="block neon-box p-6 opacity-75 hover:opacity-100 transition-all hover:shadow-lg hover:scale-102 rounded-lg"
                    >
                      <h3 className="text-lg font-semibold mb-3 line-clamp-2">{meeting.title}</h3>
                      <p className="text-gray-300 line-clamp-3 mb-3">{meeting.description}</p>
                      <p className="text-sm text-gray-400 mb-2">
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