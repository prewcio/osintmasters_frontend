"use client"

import type React from "react"
import { useState, useEffect } from "react"
import PageTransition from "@/components/page-transition"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"
import FileViewer from "@/components/file-viewer"
import VideoPlayer from "@/components/video-player"

type Material = {
  id: number
  title: string
  type: "video" | "file"
  src: string
  file_type: string
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

export default function Materialy() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedType, setSelectedType] = useState<"all" | "video" | "file">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true)
        const response = await api.get<PaginatedResponse<Material>>("/api/materials")
        setMaterials(response.data.data || [])
      } catch (err) {
        console.error("Failed to fetch materials:", err)
        setError("Nie udało się załadować materiałów. Spróbuj ponownie później.")
        setMaterials([]) // Ensure we always have an array even on error
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  // Ensure user is authenticated
  if (!user) {
    window.location.href = "/login"
    return null
  }

  const filteredMaterials = materials.filter(material => {
    const matchesType = selectedType === "all" ? true : material.type === selectedType
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const getFileUrl = (material: Material) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.49:8000"
    return `${baseUrl}/api/material/stream/${material.id}`
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 glitch text-center">MATERIAŁY</h1>

        <div className="mb-6 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Szukaj materiałów..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-gray-800 p-3 pl-10 focus:border-[#39FF14] focus:outline-none transition-colors"
            />
            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          </div>

          {/* Type filters */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-4 py-2 border ${
                selectedType === "all"
                  ? "border-[#39FF14] text-[#39FF14]"
                  : "border-gray-800 text-gray-400 hover:border-[#39FF14] hover:text-[#39FF14]"
              } transition-colors`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setSelectedType("video")}
              className={`px-4 py-2 border ${
                selectedType === "video"
                  ? "border-[#39FF14] text-[#39FF14]"
                  : "border-gray-800 text-gray-400 hover:border-[#39FF14] hover:text-[#39FF14]"
              } transition-colors`}
            >
              Wideo
            </button>
            <button
              onClick={() => setSelectedType("file")}
              className={`px-4 py-2 border ${
                selectedType === "file"
                  ? "border-[#39FF14] text-[#39FF14]"
                  : "border-gray-800 text-gray-400 hover:border-[#39FF14] hover:text-[#39FF14]"
              } transition-colors`}
            >
              Pliki
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center">Ładowanie...</div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : filteredMaterials.length === 0 ? (
            <p className="text-center text-gray-400">
              {searchQuery
                ? "Nie znaleziono materiałów spełniających kryteria wyszukiwania"
                : selectedType === "all"
                ? "Brak materiałów"
                : selectedType === "video"
                ? "Brak materiałów wideo"
                : "Brak plików"}
            </p>
          ) : (
            filteredMaterials.map((material) => (
              <div key={material.id} className="neon-box p-4">
                <h3 className="text-lg font-semibold mb-4">{material.title}</h3>
                {material.type === "video" ? (
                  <div className="aspect-video mb-4">
                    <VideoPlayer
                      src={getFileUrl(material)}
                    />
                  </div>
                ) : (
                  <FileViewer
                    src={getFileUrl(material)}
                    title={material.title}
                    fileType={material.file_type}
                  />
                )}
                <div className="text-sm text-gray-400">
                  {material.creator && (
                    <p>Dodane przez: {material.creator.name}</p>
                  )}
                  <p>
                    Data dodania:{" "}
                    {new Date(material.created_at).toLocaleString("pl-PL", {
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
              </div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  )
}

