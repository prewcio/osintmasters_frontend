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
      // First, get the CSRF token
      await api.get("/sanctum/csrf-cookie", {
        withCredentials: true,
        headers: {
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      })

      // Then attempt login
      const response = await api.post("/api/login", {
        email,
        password,
      }, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      })

      if (response.data.token) {
        // Store the token in localStorage
        localStorage.setItem("token", response.data.token)
        
        // Update auth context
        await login(email, password)

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        throw new Error("No token received")
      }
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
        <div className="max-w-md w-full mx-4">
          <h1 className="text-4xl font-bold text-center mb-8 glitch">OSINT MASTERS</h1>
          <div className="border border-gray-800 p-8 rounded-lg neon-box">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-800 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Hasło
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-800 rounded-md bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent"
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <div>
                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Logowanie..." : "Zaloguj się"}
                </AnimatedButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

