"use client"

import type React from "react"

import { useState, useEffect } from "react"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
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

export default function AdminNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [newNewsContent, setNewNewsContent] = useState("")
  const [isSystemPost, setIsSystemPost] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const response = await api.get<NewsItem[]>("/api/admin/news")
      setNews(response.data)
    } catch (error) {
      console.error("Failed to fetch news:", error)
      setError("Nie udało się załadować aktualności. Spróbuj ponownie później.")
    } finally {
      setLoading(false)
    }
  }

  const addNews = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newNewsContent.trim()) {
      try {
        const response = await api.post<NewsItem>("/api/admin/news", {
          content: newNewsContent,
          is_system_post: isSystemPost
        })
        setNews([...news, response.data])
        setNewNewsContent("")
        setIsSystemPost(false)
      } catch (error) {
        console.error("Error adding news:", error)
        setError("Nie udało się dodać aktualności. Spróbuj ponownie później.")
      }
    }
  }

  const deleteNews = async (id: number) => {
    try {
      await api.delete(`/api/admin/news/${id}`)
      setNews(news.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Error deleting news:", error)
      setError("Nie udało się usunąć aktualności. Spróbuj ponownie później.")
    }
  }

  const editNews = async (id: number, content: string) => {
    try {
      const response = await api.put<NewsItem>(`/api/admin/news/${id}`, { content })
      setNews(news.map((item) => (item.id === id ? response.data : item)))
    } catch (error) {
      console.error("Error editing news:", error)
      setError("Nie udało się edytować aktualności. Spróbuj ponownie później.")
    }
  }

  if (!user) {
    window.location.href = "/login"
    return null
  }

  if (loading) {
    return <div>Ładowanie...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 glitch">Zarządzanie Aktualnościami</h1>

        <form onSubmit={addNews} className="mb-8 neon-box p-4">
          <h2 className="text-xl mb-4">Dodaj nową aktualność</h2>
          <div className="space-y-4">
            <textarea
              value={newNewsContent}
              onChange={(e) => setNewNewsContent(e.target.value)}
              placeholder="Treść aktualności"
              className="w-full bg-black border border-gray-800 p-2"
              required
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isSystemPost"
                checked={isSystemPost}
                onChange={(e) => setIsSystemPost(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="isSystemPost">Post systemowy</label>
            </div>
            <AnimatedButton type="submit">Dodaj</AnimatedButton>
          </div>
        </form>

        <div className="neon-box p-4">
          <h2 className="text-xl mb-4">Lista aktualności</h2>
          {news.map((item) => (
            <div key={item.id} className="border-b border-gray-800 py-4 last:border-b-0">
              <p className="mb-2">{item.content}</p>
              <p className="text-sm text-gray-400">
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
              <div className="mt-2 space-x-2">
                <AnimatedButton
                  onClick={() => {
                    const newContent = prompt("Edytuj aktualność:", item.content)
                    if (newContent) editNews(item.id, newContent)
                  }}
                >
                  Edytuj
                </AnimatedButton>
                <AnimatedButton onClick={() => deleteNews(item.id)} className="bg-red-500">
                  Usuń
                </AnimatedButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}

