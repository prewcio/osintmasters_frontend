"use client"

import type React from "react"
import { useState, useEffect } from "react"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import { useAuth } from "@/hooks/useAuth"

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setUsername(user.name)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Hasła nie są zgodne")
      return
    }

    const formData = new FormData()
    if (email !== user?.email) formData.append("email", email)
    if (username !== user?.name) formData.append("name", username)
    if (password) formData.append("password", password)

    try {
      await updateUser(formData)
      alert("Ustawienia zaktualizowane pomyślnie")
      // Clear password fields after successful update
      setPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Failed to update settings:", error)
      alert("Nie udało się zaktualizować ustawień")
    }
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 glitch">Ustawienia</h1>
        <form onSubmit={handleSubmit} className="space-y-6 neon-box p-6">
          <div>
            <label htmlFor="username" className="block mb-2">
              Nazwa użytkownika
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-gray-800 p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-gray-800 p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2">
              Nowe hasło
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-800 p-2"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block mb-2">
              Potwierdź nowe hasło
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black border border-gray-800 p-2"
            />
          </div>
          <AnimatedButton type="submit">Zapisz zmiany</AnimatedButton>
        </form>
      </div>
    </PageTransition>
  )
}

