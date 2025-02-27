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
      // First, get the CSRF token using fetch
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': window.location.origin,
          'Referer': window.location.origin,
        },
      })

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token')
      }

      // Get the XSRF-TOKEN from cookies
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1]

      if (!token) {
        throw new Error('No CSRF token found')
      }

      // Then attempt login using fetch
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': decodeURIComponent(token),
          'Origin': window.location.origin,
          'Referer': window.location.origin,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}))
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await loginResponse.json()

      if (data.token) {
        // Store the token in localStorage
        localStorage.setItem("token", data.token)
        
        // Update auth context
        await login(email, password)

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        throw new Error("No token received")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Nieprawidłowy email lub hasło")
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

