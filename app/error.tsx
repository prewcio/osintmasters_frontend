"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AnimatedButton from "@/components/animated-button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      digest: error?.digest
    })
    
    // Check if it's a client-side exception and redirect to home
    if (error?.message?.includes("a client-side exception has occurred")) {
      router.push("/")
    }
  }, [error, router])

  // Safely access error properties
  const errorMessage = error?.message || "Wystąpił nieoczekiwany błąd"
  const errorDigest = error?.digest || "Brak dostępnego podsumowania"

  const handleReset = () => {
    try {
      if (typeof reset === "function") {
        reset()
      } else {
        // Fallback behavior: refresh the page
        router.refresh()
      }
    } catch (e) {
      console.error("Reset failed:", e)
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-8xl font-bold glitch mb-4">500</h1>
        <h2 className="text-2xl font-semibold mb-8 typing">KRYTYCZNY BŁĄD SYSTEMU</h2>

        <div className="neon-box p-6 mb-8 text-left space-y-4">
          <p className="text-red-500 font-mono">{`> DZIENNIK BŁĘDÓW:`}</p>
          <p className="font-mono text-sm">{'<error code="500" timestamp="' + new Date().toISOString() + '" />'}</p>
          <p className="font-mono text-sm text-gray-400">Wystąpił krytyczny błąd systemu.</p>
          <p className="font-mono text-sm text-gray-400">Identyfikator błędu: {errorDigest}</p>
          <div className="border-l-4 border-red-500 pl-4 mt-4">
            <p className="font-mono text-sm text-red-500">{errorMessage}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <AnimatedButton onClick={handleReset}>RESET SYSTEMU</AnimatedButton>
          <AnimatedButton href="/">WYJŚCIE AWARYJNE</AnimatedButton>
        </div>
      </div>

      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.5)_50%,transparent_100%)] animate-scan" />
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500 opacity-20 animate-glitch" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-red-500 opacity-20 animate-glitch" />
      </div>
    </div>
  )
}

