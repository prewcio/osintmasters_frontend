"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import AnimatedButton from "./animated-button"
import api from "@/lib/axios"

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface FileViewerProps {
  src: string
  title: string
  fileType: string
}

export default function FileViewer({ src, title, fileType }: FileViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF:", error)
    setError("Nie udało się załadować pliku PDF")
    setIsLoading(false)
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1))
  }

  const renderFilePreview = () => {
    const fileTypeLower = fileType.toLowerCase()

    if (fileTypeLower === "pdf") {
      return (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-full overflow-auto bg-black/50 rounded-lg p-2 sm:p-4">
            <Document
              file={src}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex justify-center items-center h-[200px] sm:h-[300px] text-gray-400">
                  Ładowanie...
                </div>
              }
              error={
                <div className="flex justify-center items-center h-[200px] sm:h-[300px] text-red-500">
                  {error || "Błąd ładowania pliku"}
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="max-w-full"
                width={Math.min(window.innerWidth - 48, 800)}
              />
            </Document>
          </div>
          {numPages && numPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-4">
              <AnimatedButton
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="text-sm sm:text-base"
              >
                Poprzednia
              </AnimatedButton>
              <span className="text-sm sm:text-base">
                Strona {pageNumber} z {numPages}
              </span>
              <AnimatedButton
                onClick={goToNextPage}
                disabled={pageNumber >= (numPages || 1)}
                className="text-sm sm:text-base"
              >
                Następna
              </AnimatedButton>
            </div>
          )}
        </div>
      )
    }

    if (["jpg", "jpeg", "png", "gif"].includes(fileTypeLower)) {
      return (
        <div className="relative w-full aspect-video bg-black/50 rounded-lg overflow-hidden">
          <img
            src={src}
            alt={title}
            className="w-full h-full object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError("Nie udało się załadować obrazu")
              setIsLoading(false)
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Ładowanie...
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              {error}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center p-4 sm:p-6 bg-black/50 rounded-lg">
        <AnimatedButton
          onClick={() => window.open(src, "_blank")}
          className="text-sm sm:text-base"
        >
          Pobierz plik
        </AnimatedButton>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <h3 className="text-sm sm:text-base font-medium truncate mr-2">{title}</h3>
        <span className="text-xs sm:text-sm text-gray-400 uppercase">{fileType}</span>
      </div>
      {renderFilePreview()}
    </div>
  )
}

