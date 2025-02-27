"use client"

import type React from "react"
import { useState, useEffect } from "react"
import PageTransition from "@/components/page-transition"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"

type User = {
  id: number
  name: string
}

type NewsItem = {
  id: number
  content: string
  author: number
  user: User
  created_at: string
  updated_at: string
  is_system_post: boolean
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
      const response = await api.get<NewsItem[]>("/api/news")
      setNews(response.data || [])
    } catch (error: any) {
      console.error("Failed to fetch news:", error)
      setError(error.response?.data?.message || "Failed to load news")
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <h2 className="text-center text-2xl md:text-3xl lg:text-4xl mb-8 glitch">WSZYSTKIE AKTUALNOŚCI</h2>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full">
              <p className="text-center">Loading...</p>
            </div>
          ) : error ? (
            <div className="col-span-full">
              <p className="text-center text-red-500">{error}</p>
            </div>
          ) : news.length === 0 ? (
            <div className="col-span-full">
              <p className="text-center text-gray-400">Brak danych</p>
            </div>
          ) : (
            news.map((item) => (
              <div 
                key={item.id} 
                className="border border-gray-800 p-6 neon-box rounded-lg transition-transform hover:scale-102 hover:shadow-lg"
              >
                <p className="mb-4 text-base md:text-lg">{item.content}</p>
                <div className="flex justify-between items-center text-gray-400 text-sm">
                  <span className="font-medium">
                    {item.is_system_post ? "SYSTEM" : item.user.name}
                  </span>
                  <span>
                    {new Date(item.created_at).toLocaleString("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  )
}

