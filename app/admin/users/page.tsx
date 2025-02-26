"use client"

import type React from "react"
import { useState, useEffect } from "react"
import PageTransition from "@/components/page-transition"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"

type User = {
  id: number
  name: string
  email: string
  role: "admin" | "user"
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "user" as "admin" | "user" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get<User[]>("/api/admin/users")
      setUsers(response.data)
    } catch (err) {
      console.error("Failed to fetch users:", err)
      setError("Nie udało się załadować użytkowników. Spróbuj ponownie później.")
      showToast("Nie udało się załadować użytkowników", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.post<User>("/api/admin/users", newUser)
      setUsers(prev => [...prev, response.data])
      setNewUser({ name: "", email: "", role: "user" })
      showToast("Użytkownik został dodany pomyślnie", "success")
      await fetchUsers() // Refresh the list to ensure we have the latest data
    } catch (err: any) {
      console.error("Failed to add user:", err)
      const errorMessage = err.response?.data?.message || "Nie udało się dodać użytkownika"
      setError(errorMessage)
      showToast(errorMessage, "error")
    }
  }

  const handleDeleteUser = async (id: number) => {
    try {
      await api.delete(`/api/admin/users/${id}`)
      setUsers(users.filter((user) => user.id !== id))
      showToast("Użytkownik został usunięty", "success")
    } catch (err: any) {
      console.error("Failed to delete user:", err)
      const errorMessage = err.response?.data?.message || "Nie udało się usunąć użytkownika"
      setError(errorMessage)
      showToast(errorMessage, "error")
    }
  }

  // Ensure user is authenticated and is admin
  if (!user) {
    window.location.href = "/login"
    return null
  }

  if (loading) {
    return <div>Ładowanie...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <PageTransition>
      <div>
        <h1 className="text-3xl font-bold mb-8 glitch">Zarządzanie Użytkownikami</h1>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 p-4 rounded shadow-lg transition-all duration-300 ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {toast.message}
          </div>
        )}

        <form onSubmit={handleAddUser} className="neon-box p-4 mb-8">
          <h2 className="text-xl mb-4">Dodaj nowego użytkownika</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Nazwa użytkownika"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="bg-black border border-gray-800 p-2 flex-grow"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="bg-black border border-gray-800 p-2 flex-grow"
              required
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "admin" | "user" })}
              className="bg-black border border-gray-800 p-2"
            >
              <option value="user">Użytkownik</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-colors duration-300 px-4 py-2"
            >
              Dodaj
            </button>
          </div>
        </form>

        <div className="neon-box p-4">
          <h2 className="text-xl mb-4">Lista użytkowników</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Nazwa użytkownika</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Rola</th>
                <th className="text-left p-2">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-800">
                  <td className="p-2">{user.id}</td>
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.role === "admin" ? "Admin" : "Użytkownik"}</td>
                  <td className="p-2">
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700">
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  )
}

