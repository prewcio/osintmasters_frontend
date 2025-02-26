"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AnimatedButton from "@/components/animated-button"

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 0) {
          clearInterval(timer)
          router.push("/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-8xl font-bold glitch mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-8 typing">AWARIA SYSTEMU: STRONA NIE ZNALEZIONA</h2>

        <div className="neon-box p-6 mb-8 text-left space-y-4">
          <p className="text-green-500 font-mono">{`> DZIENNIK SYSTEMU:`}</p>
          <p className="font-mono text-sm">{'<error code="404" timestamp="' + new Date().toISOString() + '" />'}</p>
          <p className="font-mono text-sm text-gray-400">Żądany zasób nie został znaleziony na serwerze.</p>
          <p className="font-mono text-sm text-gray-400">Zainicjowano automatyczne przywracanie systemu...</p>
          <p className="font-mono text-sm text-[#39FF14]">Przekierowanie do bezpiecznej strefy za {countdown} sekund...</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <AnimatedButton onClick={() => router.back()}>{"<"} WRÓĆ</AnimatedButton>
          <AnimatedButton href="/">STRONA GŁÓWNA</AnimatedButton>
        </div>
      </div>

      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.5)_50%,transparent_100%)] animate-scan" />
        <div className="absolute top-0 left-0 w-full h-2 bg-[#39FF14] opacity-20 animate-glitch" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-[#39FF14] opacity-20 animate-glitch" />
      </div>
    </div>
  )
}

