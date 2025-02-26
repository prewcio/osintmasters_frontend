"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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

export default function MeetingDetails() {
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true)
        const response = await api.get<Meeting>(`/api/meetings/${id}`)
        setMeeting(response.data)
      } catch (err) {
        console.error("Failed to fetch meeting:", err)
        setError("Nie udało się załadować szczegółów spotkania. Spróbuj ponownie później.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchMeeting()
    }
  }, [id])

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
          <div className="text-red-500 text-center mb-4">{error}</div>
          <div className="text-center">
            <AnimatedButton href="/dashboard/meetings">
              Powrót do listy spotkań
            </AnimatedButton>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!meeting) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center text-gray-400 mb-4">Nie znaleziono spotkania</div>
          <div className="text-center">
            <AnimatedButton href="/dashboard/meetings">
              Powrót do listy spotkań
            </AnimatedButton>
          </div>
        </div>
      </PageTransition>
    )
  }

  const meetingDate = new Date(meeting.date)
  const isUpcoming = meetingDate > new Date()

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/dashboard/meetings"
            className="text-[#39FF14] hover:underline"
          >
            ← Powrót do listy spotkań
          </Link>
          {isUpcoming && meeting.link && (
            <a
              href={meeting.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-black text-white border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-8 py-3 relative overflow-hidden shadow-[0_0_10px_#39FF14]"
            >
              Dołącz do spotkania
            </a>
          )}
        </div>

        <div className="neon-box p-6">
          <h1 className="text-3xl font-bold mb-6 glitch">{meeting.title}</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl mb-2">Opis</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{meeting.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h2 className="text-xl mb-2">Data i godzina</h2>
                <p className="text-gray-300">
                  {meetingDate.toLocaleString("pl-PL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false
                  })}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isUpcoming ? (
                    <span>
                      Spotkanie odbędzie się za{" "}
                      <Countdown targetDate={meetingDate} className="text-[#39FF14]" />
                    </span>
                  ) : (
                    <span>
                      Spotkanie odbyło się{" "}
                      {Math.abs(Math.round((meetingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}{" "}
                      dni temu
                    </span>
                  )}
                </p>
              </div>

              <div>
                <h2 className="text-xl mb-2">Lokalizacja</h2>
                <p className="text-gray-300">{meeting.location}</p>
              </div>
            </div>

            {meeting.link && (
              <div>
                <h2 className="text-xl mb-2">Link do spotkania</h2>
                <a
                  href={meeting.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#39FF14] hover:underline break-all"
                >
                  {meeting.link}
                </a>
              </div>
            )}

            {meeting.creator && (
              <div className="text-sm text-gray-400">
                Utworzone przez: {meeting.creator.name}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 