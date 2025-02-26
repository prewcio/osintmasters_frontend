"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import api from "@/lib/axios"
import { useAuth } from "@/hooks/useAuth"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await api.post("/api/login", {
        email,
        password,
      })

      // Store the token in localStorage or cookies
      localStorage.setItem("token", response.data.token)

      // Update auth context
      await login(email, password)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.response?.data?.message || "Nieprawidłowy email lub hasło")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full neon-box p-8">
          <h1 className="text-3xl font-bold mb-6 text-center glitch">Logowanie</h1>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-2 text-sm">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-gray-800 p-3 rounded-md focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-colors outline-none"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-2 text-sm">
                Hasło
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-gray-800 p-3 rounded-md focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] transition-colors outline-none"
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-4">
              <AnimatedButton type="submit" disabled={loading} className="w-full">
                {loading ? "Logowanie..." : "Zaloguj się"}
              </AnimatedButton>
              <AnimatedButton href="/" className="w-full">
                Powrót
              </AnimatedButton>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  )
}

