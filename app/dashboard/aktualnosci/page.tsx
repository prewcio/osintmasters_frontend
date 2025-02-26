"use client"

import type React from "react"
import { useState, useEffect } from "react"
import PageTransition from "@/components/page-transition"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"

type Author = {
  id: number
  name: string
}

type NewsItem = {
  id: number
  content: string
  author: Author
  created_at: string
  updated_at: string
  is_system_post: boolean
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

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const response = await api.get<PaginatedResponse<NewsItem>>("/api/news")
      setNews(response.data.data || [])
    } catch (error: any) {
      console.error("Failed to fetch news:", error)
      setError(error.response?.data?.message || "Failed to load news")
      if (error.response?.status === 401) {
        window.location.href = "/login"
      }
    } finally {
      setLoading(false)
    }
  }

  // Ensure user is authenticated
  if (!user) {
    window.location.href = "/login"
    return null
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4">
        <h2 className="text-center text-xl mb-6 glitch">WSZYSTKIE AKTUALNOŚCI</h2>
        <div className="space-y-4">
          {loading ? (
            <p className="text-center">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : news.length === 0 ? (
            <p className="text-center text-gray-400">Brak danych</p>
          ) : (
            news.map((item) => (
              <div key={item.id} className="border border-gray-800 p-4 neon-box">
                <p className="mb-2">{item.content}</p>
                <p className="text-gray-400 text-sm">
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
    </PageTransition>
  )
}

