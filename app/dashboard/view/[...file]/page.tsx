"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"
import Link from "next/link"

type FileDetails = {
  title: string
  type: string
  url: string
}

export default function FileViewer() {
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const params = useParams()
  const filePath = (params.file as string[])?.join("/") || ""

  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        setLoading(true)
        const response = await api.get<FileDetails>(`/api/files/${filePath}`)
        setFileDetails(response.data)
      } catch (err) {
        console.error("Failed to fetch file details:", err)
        setError("Nie udało się załadować pliku. Spróbuj ponownie później.")
      } finally {
        setLoading(false)
      }
    }

    if (filePath) {
      fetchFileDetails()
    }
  }, [filePath])

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

  if (error || !fileDetails) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-red-500 text-center mb-4">{error || "Nie znaleziono pliku"}</div>
          <div className="text-center">
            <AnimatedButton href="/dashboard/materialy">
              Powrót do materiałów
            </AnimatedButton>
          </div>
        </div>
      </PageTransition>
    )
  }

  const renderFileContent = () => {
    const fileUrl = fileDetails.url.startsWith('http') 
      ? fileDetails.url 
      : `${api.defaults.baseURL}${fileDetails.url}`

    switch (fileDetails.type.toLowerCase()) {
      case "pdf":
        return (
          <object
            data={fileUrl}
            type="application/pdf"
            className="w-full h-[calc(100vh-200px)]"
          >
            <div className="text-center p-8">
              <p className="text-gray-400 mb-4">
                Nie można wyświetlić pliku PDF. Proszę pobrać plik, aby go otworzyć.
              </p>
            </div>
          </object>
        )
      case "txt":
        return (
          <iframe
            src={fileUrl}
            className="w-full h-[calc(100vh-200px)] border-0 bg-black text-white p-4"
            title={fileDetails.title}
          />
        )
      default:
        return (
          <div className="text-center p-8">
            <p className="text-gray-400 mb-4">
              Ten typ pliku nie może być wyświetlony bezpośrednio w przeglądarce.
            </p>
            <Link href={fileUrl} passHref>
              <AnimatedButton>
                Pobierz plik
              </AnimatedButton>
            </Link>
          </div>
        )
    }
  }

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <AnimatedButton href="/dashboard/materialy">
            ← Powrót do materiałów
          </AnimatedButton>
          <Link href={fileDetails.url} passHref>
            <AnimatedButton>
              Pobierz
            </AnimatedButton>
          </Link>
        </div>

        <div className="neon-box">
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-semibold">{fileDetails.title}</h1>
          </div>
          <div className="p-4">
            {renderFileContent()}
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 