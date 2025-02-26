"use client"

import type React from "react"
import { useState, useEffect } from "react"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"

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

export default function AdminMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<"all" | "video" | "file">("all")
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    type: "file" as "video" | "file",
    file: null as File | null
  })
  const { user } = useAuth()

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true)
        const response = await api.get<Material[]>("/api/admin/materials")
        setMaterials(response.data || [])
      } catch (err) {
        console.error("Failed to fetch materials:", err)
        setError("Nie udało się załadować materiałów. Spróbuj ponownie później.")
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  // Ensure user is authenticated and is admin
  if (!user || (user.role !== "admin" && !user.is_admin)) {
    window.location.href = "/dashboard"
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('Selected file:', {
        name: file.name,
        size: file.size,
        type: file.type
      })
      setNewMaterial(prev => ({ ...prev, file }))
    }
  }

  const uploadChunk = async (
    file: File,
    chunk: number,
    chunks: number,
    chunkSize: number,
    title: string,
    type: "video" | "file",
    retryCount = 0
  ) => {
    const start = chunk * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunkBlob = file.slice(start, end)

    const formData = new FormData()
    formData.append("title", title)
    formData.append("type", type)
    formData.append("file", chunkBlob, file.name) // Add original filename
    formData.append("chunk", chunk.toString())
    formData.append("chunks", chunks.toString())
    formData.append("chunk_size", chunkSize.toString())
    formData.append("total_size", file.size.toString())
    formData.append("mime_type", file.type)

    try {
      console.log(`Uploading chunk ${chunk + 1}/${chunks}, size: ${chunkBlob.size} bytes`)
      const response = await api.post<{ uploaded: boolean; progress: number }>("/api/admin/materials", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!)
          console.log(`Chunk ${chunk + 1} progress: ${percentCompleted}%`)
        }
      })

      setUploadProgress(prev => ({
        ...prev,
        [title]: response.data.progress
      }))

      return response.data.uploaded
    } catch (err: any) {
      console.error("Upload chunk error:", {
        chunk,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers
      })
      
      // If we get a "Content Too Large" error or it's a server error (5xx)
      if (err.response?.status === 413 || (err.response?.status >= 500 && err.response?.status < 600)) {
        if (retryCount < 3) {
          console.log(`Retrying chunk ${chunk + 1} with smaller size (attempt ${retryCount + 1})`)
          // Wait before retrying with exponential backoff
          await delay((retryCount + 1) * 1000)
          return uploadChunk(file, chunk, chunks, chunkSize / 2, title, type, retryCount + 1)
        }
      }
      throw err
    }
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMaterial.file || !newMaterial.title) {
      alert("Wypełnij wszystkie pola")
      return
    }

    // Start with smaller chunks for better reliability
    const chunkSize = 2 * 1024 * 1024 // Start with 2MB chunks
    const chunks = Math.ceil(newMaterial.file.size / chunkSize)

    try {
      console.log('Starting upload:', {
        fileName: newMaterial.file.name,
        fileSize: newMaterial.file.size,
        chunks,
        chunkSize
      })

      setUploadProgress(prev => ({
        ...prev,
        [newMaterial.title]: 0
      }))

      for (let chunk = 0; chunk < chunks; chunk++) {
        const isComplete = await uploadChunk(
          newMaterial.file,
          chunk,
          chunks,
          chunkSize,
          newMaterial.title,
          newMaterial.type
        )

        if (isComplete) {
          console.log('Upload completed successfully')
          // Refresh materials list
          const response = await api.get<Material[]>("/api/admin/materials")
          setMaterials(response.data || [])
          // Reset form
          setNewMaterial({
            title: "",
            type: "file",
            file: null
          })
          // Reset file input
          const fileInput = document.getElementById("file") as HTMLInputElement
          if (fileInput) fileInput.value = ""
          // Clear progress
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[newMaterial.title]
            return newProgress
          })
          break
        }

        // Add a delay between chunks to prevent rate limiting
        if (chunk < chunks - 1) {
          await delay(1000) // 1 second delay between chunks
        }
      }
    } catch (err: any) {
      console.error("Upload failed:", {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      alert(err.response?.data?.message || "Nie udało się dodać materiału. Spróbuj ponownie później.")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Czy na pewno chcesz usunąć ten materiał?")) {
      return
    }

    try {
      await api.delete(`/api/admin/materials/${id}`)
      setMaterials(materials.filter(m => m.id !== id))
    } catch (err) {
      console.error("Failed to delete material:", err)
      alert("Nie udało się usunąć materiału. Spróbuj ponownie później.")
    }
  }

  const filteredMaterials = materials.filter(material => {
    const matchesType = selectedType === "all" ? true : material.type === selectedType
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  if (loading) {
    return (
      <PageTransition>
        <div className="text-center">Ładowanie...</div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 glitch text-center">Zarządzanie Materiałami</h1>

        {/* Search and filter section */}
        <div className="mb-8 space-y-4">
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

          <div className="flex justify-start space-x-4">
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

        <form onSubmit={handleSubmit} className="mb-8 neon-box p-4">
          <h2 className="text-xl mb-4">Dodaj nowy materiał</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block mb-2">
                Tytuł
              </label>
              <input
                type="text"
                id="title"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-black border border-gray-800 p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="type" className="block mb-2">
                Typ
              </label>
              <select
                id="type"
                value={newMaterial.type}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, type: e.target.value as "video" | "file" }))}
                className="w-full bg-black border border-gray-800 p-2"
                required
              >
                <option value="file">Plik</option>
                <option value="video">Wideo</option>
              </select>
            </div>
            <div>
              <label htmlFor="file" className="block mb-2">
                Plik
              </label>
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="w-full bg-black border border-gray-800 p-2"
                accept={newMaterial.type === "video" ? "video/*" : undefined}
                required
              />
            </div>
            {uploadProgress[newMaterial.title] !== undefined && (
              <div className="w-full bg-gray-800 rounded-full h-2.5">
                <div
                  className="bg-[#39FF14] h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress[newMaterial.title]}%` }}
                ></div>
              </div>
            )}
            <AnimatedButton type="submit">Dodaj materiał</AnimatedButton>
          </div>
        </form>

        <div className="neon-box p-4">
          <h2 className="text-xl mb-4">Lista materiałów</h2>
          {error ? (
            <p className="text-red-500 text-center">{error}</p>
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
            <div className="space-y-4">
              {filteredMaterials.map((material) => (
                <div key={material.id} className="border-b border-gray-800 last:border-b-0 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{material.title}</h3>
                      <p className="text-sm text-gray-400">
                        Typ: {material.type === "video" ? "Wideo" : "Plik"}
                      </p>
                      {material.creator && (
                        <p className="text-sm text-gray-400">
                          Dodane przez: {material.creator.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-400">
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
                    <div className="space-x-2">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.49:8000"}/api/material/stream/${material.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-black text-white border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-4 py-2 text-sm"
                      >
                        Otwórz
                      </a>
                      <AnimatedButton onClick={() => handleDelete(material.id)} className="bg-red-500">
                        Usuń
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
} 