"use client"

import { useState, useEffect } from "react"
import AnimatedButton from "./animated-button"
import api from "@/lib/axios"

type FileViewerProps = {
  src: string
  title: string
  fileType: string
}

export default function FileViewer({ src, title, fileType }: FileViewerProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getFileIcon = () => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "📄"
      case "doc":
      case "docx":
        return "📝"
      case "xls":
      case "xlsx":
        return "📊"
      case "txt":
        return "📋"
      default:
        return "📁"
    }
  }

  const getFileTypeName = () => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "PDF"
      case "doc":
      case "docx":
        return "Dokument Word"
      case "xls":
      case "xlsx":
        return "Arkusz Excel"
      case "txt":
        return "Plik tekstowy"
      default:
        return "Plik"
    }
  }

  // Ensure the URL is properly formatted and encoded
  const getFileUrl = () => {
    if (src.startsWith('http')) {
      return src
    }
    // Remove any leading slashes
    const cleanPath = src.replace(/^\/+/, '')
    return `${api.defaults.baseURL}/${cleanPath}`
  }

  const fetchTextContent = async () => {
    try {
      setError(null)
      const response = await api.get(src)
      setPreviewContent(response.data)
    } catch (err) {
      console.error('Failed to fetch text content:', err)
      setError('Nie udało się załadować zawartości pliku.')
    }
  }

  useEffect(() => {
    if (isPreviewOpen && fileType.toLowerCase() === 'txt') {
      fetchTextContent()
    }
  }, [isPreviewOpen, fileType, src])

  const renderPreview = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-500 mb-4">{error}</p>
          <a
            href={getFileUrl()}
            download
            className="text-[#39FF14] hover:underline text-lg"
            onClick={(e) => e.stopPropagation()}
          >
            Pobierz plik
          </a>
        </div>
      )
    }

    const fileUrl = getFileUrl()

    switch (fileType.toLowerCase()) {
      case "pdf":
        return (
          <div className="relative w-full h-full bg-white">
            <embed
              src={`${fileUrl}#toolbar=0&navpanes=0`}
              type="application/pdf"
              className="w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4 flex justify-center">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#39FF14] hover:underline mr-4"
                onClick={(e) => e.stopPropagation()}
              >
                Otwórz w nowej karcie
              </a>
              <a
                href={fileUrl}
                download
                className="text-[#39FF14] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Pobierz PDF
              </a>
            </div>
          </div>
        )
      case "txt":
        return (
          <div className="relative w-full h-full">
            <div className="w-full h-full overflow-auto bg-black text-white p-4 font-mono">
              {previewContent ? (
                <pre className="whitespace-pre-wrap">{previewContent}</pre>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#39FF14]"></div>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4 flex justify-center">
              <a
                href={fileUrl}
                download
                className="text-[#39FF14] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Pobierz plik
              </a>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-8xl mb-6">{getFileIcon()}</div>
            <p className="text-xl mb-4">{title}</p>
            <p className="text-gray-400 mb-6">
              Ten typ pliku ({getFileTypeName()}) nie może być wyświetlony bezpośrednio w przeglądarce.
            </p>
            <a
              href={fileUrl}
              download
              className="text-[#39FF14] hover:underline text-lg"
              onClick={(e) => e.stopPropagation()}
            >
              Pobierz plik
            </a>
          </div>
        )
    }
  }

  const handlePreviewClick = () => {
    setError(null)
    setPreviewContent(null)
    setIsPreviewOpen(true)
  }

  return (
    <>
      <div className="text-center">
        <div className="text-6xl mb-4">{getFileIcon()}</div>
        <p className="text-lg mb-2">{title}</p>
        <p className="text-gray-400 mb-4">{getFileTypeName()}</p>
        <div className="space-x-4">
          <AnimatedButton onClick={handlePreviewClick}>
            Podgląd
          </AnimatedButton>
          <a
            href={getFileUrl()}
            download
            onClick={(e) => e.stopPropagation()}
            className="inline-block bg-black text-white border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-8 py-3"
          >
            Pobierz
          </a>
        </div>
      </div>

      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div 
            className="bg-gray-900 w-full max-w-6xl h-[90vh] rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <span className="mr-2">{getFileIcon()}</span>
                {title}
              </h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="h-[calc(90vh-64px)]">
              {renderPreview()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

