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

// Add MD5 checksum calculation utility
const calculateMD5 = async (file: File | Blob) => {
  try {
    // First try using SHA-256 as it's widely supported
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Hash calculation failed:', error);
    // Return a timestamp-based hash as fallback
    return Date.now().toString(16) + Math.random().toString(16).slice(2);
  }
}

// Add chunk size calculation utility
const getChunkSize = (fileSize: number) => {
  if (fileSize <= 100 * 1024 * 1024) return 1 * 1024 * 1024 // 1MB for files up to 100MB
  if (fileSize <= 1024 * 1024 * 1024) return 5 * 1024 * 1024 // 5MB for files up to 1GB
  return 10 * 1024 * 1024 // 10MB for files larger than 1GB
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
      // Define accepted file types with their extensions and MIME types
      const acceptedTypes = {
        video: {
          mimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
          extensions: ['.mp4', '.webm', '.ogg'],
          maxSize: 3 * 1024 * 1024 * 1024, // 3GB
        },
        file: {
          mimeTypes: [
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            // Archives
            'application/zip',
            'application/x-rar-compressed',
            // Images
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
          ],
          extensions: [
            // Documents
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt',
            // Archives
            '.zip', '.rar',
            // Images
            '.jpg', '.jpeg', '.png', '.gif', '.webp'
          ],
          maxSize: 500 * 1024 * 1024, // 500MB for regular files
        }
      }

      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      const selectedType = newMaterial.type as keyof typeof acceptedTypes
      const typeConfig = acceptedTypes[selectedType]

      // Check file extension
      if (!typeConfig.extensions.includes(fileExtension)) {
        alert(`Nieprawidłowy format pliku. Dozwolone formaty dla typu ${selectedType === 'video' ? 'wideo' : 'pliku'}:\n${typeConfig.extensions.join(', ')}`)
        e.target.value = ''
        return
      }

      // Check MIME type
      if (!typeConfig.mimeTypes.includes(file.type)) {
        alert(`Nieprawidłowy typ pliku. Dozwolone typy dla ${selectedType === 'video' ? 'wideo' : 'pliku'}:\n${typeConfig.extensions.join(', ')}`)
        e.target.value = ''
        return
      }

      // Validate file size based on type
      if (file.size > typeConfig.maxSize) {
        const maxSizeMB = typeConfig.maxSize / (1024 * 1024)
        alert(`Plik jest za duży (maksymalny rozmiar dla ${selectedType === 'video' ? 'wideo' : 'pliku'}: ${maxSizeMB}MB)`)
        e.target.value = ''
        return
      }

      console.log('Selected file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        extension: fileExtension
      })
      setNewMaterial(prev => ({ ...prev, file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMaterial.file || !newMaterial.title) {
      alert("Wypełnij wszystkie pola")
      return
    }

    try {
      // Get the authentication token
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      // Ensure we have a CSRF token
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
        credentials: 'include'
      })

      setUploadProgress(prev => ({
        ...prev,
        [newMaterial.title]: 0
      }))

      // Create FormData
      const formData = new FormData()
      formData.append("title", newMaterial.title)
      formData.append("type", newMaterial.type)
      formData.append("file", newMaterial.file)
      formData.append("file_type", newMaterial.file.name.split('.').pop() || '')

      // Get the current CSRF token
      const currentCsrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1]

      if (!currentCsrfToken) {
        throw new Error("No CSRF token found")
      }

      // Send the request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/materials`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': decodeURIComponent(currentCsrfToken),
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Upload response:', data)

      // Update materials list
      const materialsResponse = await api.get<Material[]>("/api/admin/materials")
      setMaterials(materialsResponse.data || [])
      
      // Reset form
      setNewMaterial({ title: "", type: "file", file: null })
      const fileInput = document.getElementById("file") as HTMLInputElement
      if (fileInput) fileInput.value = ""
      setUploadProgress({})

    } catch (err: any) {
      console.error("Upload failed:", err)
      if (err.message.includes("CSRF token mismatch") || err.message === "Unauthenticated.") {
        window.location.reload()
      } else {
        alert(err.message || "Nie udało się dodać materiału. Spróbuj ponownie później.")
      }
      setUploadProgress({})
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