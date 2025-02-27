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
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8 text-center">Ładowanie...</div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 glitch text-center">Zarządzanie Użytkownikami</h1>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 z-50 ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {toast.message}
          </div>
        )}

        <form onSubmit={handleAddUser} className="neon-box p-6 mb-8 rounded-lg">
          <h2 className="text-xl md:text-2xl mb-6">Dodaj nowego użytkownika</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Nazwa użytkownika"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="bg-black border border-gray-800 p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors w-full"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="bg-black border border-gray-800 p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors w-full"
              required
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "admin" | "user" })}
              className="bg-black border border-gray-800 p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors w-full"
            >
              <option value="user">Użytkownik</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-6 py-3 rounded-md w-full"
            >
              Dodaj
            </button>
          </div>
        </form>

        <div className="neon-box p-6 rounded-lg overflow-x-auto">
          <h2 className="text-xl md:text-2xl mb-6">Lista użytkowników</h2>
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-800">
                <thead>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">Nazwa użytkownika</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">Rola</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{user.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{user.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{user.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          user.role === "admin" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {user.role === "admin" ? "Admin" : "Użytkownik"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => handleDeleteUser(user.id)} 
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

