"use client"

import PageTransition from "@/components/page-transition"
import Link from "next/link"
import AnimatedButton from "@/components/animated-button"
import { useState, useEffect } from "react"
import api from "@/lib/axios"

type NewsItem = {
  id: number
  content: string
  author: {
    id: number
    name: string
  }
  created_at: string
}

type Meeting = {
  id: number
  title: string
  date: string
  location: string
  link?: string
  creator: {
    id: number
    name: string
  }
}

export default function DashboardHome() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [upcomingMeeting, setUpcomingMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [newsResponse, meetingsResponse] = await Promise.all([
          api.get<NewsItem>("/api/news/latest").catch(() => ({ data: null })),
          api.get<Meeting>("/api/meetings/upcoming").catch(() => ({ data: null }))
        ])

        // Handle news data
        if (newsResponse.data) {
          setNews(Array.isArray(newsResponse.data) ? newsResponse.data : [newsResponse.data])
        } else {
          setNews([])
        }

        // Handle meeting data
        if (meetingsResponse.data) {
          setUpcomingMeeting(meetingsResponse.data)
        } else {
          setUpcomingMeeting(null)
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
        setNews([])
        setUpcomingMeeting(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl mb-4 glitch">Ładowanie...</h2>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-center text-lg md:text-xl mb-8 md:mb-12 glitch">Witaj w panelu członka kółka OSINT Masters.</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div>
            <h3 className="text-center text-lg md:text-xl mb-4 md:mb-6">OSTATNIE AKTUALNOŚCI</h3>
            <div className="border border-gray-800 p-3 md:p-4 space-y-3 md:space-y-4 neon-box">
              {!news || news.length === 0 ? (
                <p className="text-center text-gray-400">Brak danych</p>
              ) : (
                news.map((item) => (
                  <div key={item.id} className="border-b border-gray-800 last:border-b-0 pb-3 md:pb-4 last:pb-0">
                    <p className="mb-2 text-sm md:text-base">{item.content}</p>
                    <p className="text-gray-400 text-xs md:text-sm">
                      {item.author.name} @ {new Date(item.created_at).toLocaleString("pl-PL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-center text-lg md:text-xl mb-4 md:mb-6">NAJBLIŻSZE SPOTKANIE</h3>
            <div className="border border-gray-800 p-3 md:p-4 neon-box">
              {!upcomingMeeting ? (
                <p className="text-center text-gray-400">Brak danych</p>
              ) : (
                <>
                  <p className="text-base md:text-lg font-semibold mb-2">{upcomingMeeting.title}</p>
                  <p className="text-sm md:text-base">Data: {new Date(upcomingMeeting.date).toLocaleString("pl-PL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false
                  })}</p>
                  <p className="text-sm md:text-base">Miejsce: {upcomingMeeting.location}</p>
                  {upcomingMeeting.creator && (
                    <p className="text-xs md:text-sm text-gray-400 mt-2">
                      Utworzone przez: {upcomingMeeting.creator.name}
                    </p>
                  )}
                  {upcomingMeeting.link && (
                    <p className="mt-2 text-sm md:text-base">
                      Link do spotkania:{" "}
                      <Link
                        href={upcomingMeeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#39FF14] hover:underline"
                      >
                        Dołącz do spotkania online
                      </Link>
                    </p>
                  )}
                  <div className="mt-4">
                    <AnimatedButton href={`/dashboard/meetings/${upcomingMeeting.id}`}>
                      Szczegóły spotkania
                    </AnimatedButton>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

