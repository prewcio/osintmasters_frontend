"use client"

import { useState, useEffect } from "react"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"

type Statistics = {
  userCount: number
  activePolls: number
  newMessages: number
}

type RecentActivity = {
  id: number
  description: string
  timestamp: string
}

export default function AdminDashboard() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsResponse, activitiesResponse] = await Promise.all([
          api.get<Statistics>("/api/admin/statistics"),
          api.get<RecentActivity[]>("/api/admin/recent-activities"),
        ])
        setStatistics(statsResponse.data)
        setRecentActivities(activitiesResponse.data)
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
        setError("Nie udało się załadować danych panelu. Spróbuj ponownie później.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
        <h1 className="text-3xl font-bold mb-8 glitch">Panel Administracyjny</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="neon-box p-6">
            <h2 className="text-xl mb-4">Statystyki</h2>
            {statistics && (
              <>
                <p>Użytkownicy: {statistics.userCount}</p>
                <p>Aktywne ankiety: {statistics.activePolls}</p>
                <p>Nowe wiadomości: {statistics.newMessages}</p>
              </>
            )}
          </div>
          <div className="neon-box p-6">
            <h2 className="text-xl mb-4">Ostatnie aktywności</h2>
            <ul className="list-disc list-inside">
              {recentActivities.map((activity) => (
                <li key={activity.id}>
                  {activity.description} - {new Date(activity.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
          <div className="neon-box p-6">
            <h2 className="text-xl mb-4">Szybkie akcje</h2>
            <div className="space-y-2">
              <AnimatedButton className="w-full" href="/admin/users">
                Zarządzaj Użytkownikami
              </AnimatedButton>
              <AnimatedButton className="w-full" href="/admin/news">
                Zarządzaj Aktualnościami
              </AnimatedButton>
              <AnimatedButton className="w-full" href="/admin/polls">
                Zarządzaj Ankietami
              </AnimatedButton>
              <AnimatedButton className="w-full" href="/admin/meetings">
                Zarządzaj Spotkaniami
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

