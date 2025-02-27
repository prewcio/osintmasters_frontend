"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import api from "@/lib/axios"
import { usePathname, useRouter } from "next/navigation"

export type User = {
  id: number
  name: string
  email: string
  avatar_url?: string
  role: "admin" | "user"
  is_admin?: boolean
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (data: FormData) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isProtectedRoute = (path: string) => {
    return path.startsWith("/dashboard") || path.startsWith("/admin")
  }

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token && isProtectedRoute(pathname)) {
        router.push("/login")
        setLoading(false)
        return
      }

      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      // Set the token in axios defaults
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      
      // Try to get the CSRF token
      await api.get("/sanctum/csrf-cookie", {
        withCredentials: true,
        headers: {
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      })

      // Get user data
      const response = await api.get("/api/user", {
        withCredentials: true,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      })

      setUser(response.data)
    } catch (error) {
      console.error("Auth check failed:", error)
      // Clear invalid token
      localStorage.removeItem("token")
      delete api.defaults.headers.common["Authorization"]
      setUser(null)
      
      // If on a protected route, redirect to login
      if (isProtectedRoute(pathname)) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // Get CSRF cookie first
      await api.get("/sanctum/csrf-cookie", {
        withCredentials: true,
        headers: {
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      })
      
      // Attempt login
      const response = await api.post("/api/login", 
        { email, password },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          }
        }
      )

      const token = response.data.token
      
      // Store token
      localStorage.setItem("token", token)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      
      // Get user data
      await checkAuth()
    } catch (error) {
      console.error("Login failed:", error)
      throw new Error("Login failed")
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem("token")
      await api.post("/api/logout", null, {
        withCredentials: true,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      })
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      // Always clear local storage and state, even if the API call fails
      localStorage.removeItem("token")
      delete api.defaults.headers.common["Authorization"]
      setUser(null)
      router.push("/login")
    }
  }

  const updateUser = async (data: FormData) => {
    try {
      const token = localStorage.getItem("token")
      const response = await api.post("/api/user/update", 
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          withCredentials: true
        }
      )
      setUser(response.data)
    } catch (error) {
      console.error("Failed to update user:", error)
      throw new Error("Failed to update user")
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

