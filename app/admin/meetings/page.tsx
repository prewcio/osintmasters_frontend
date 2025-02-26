"use client"

import type React from "react"
import { useState, useEffect } from "react"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"

type Meeting = {
  id: number
  title: string
  description: string
  date: string
  location: string
  link?: string
  created_at: string
}

type EditingMeeting = {
  id: number
  title: string
  description: string
  date: string
  location: string
  link?: string
}

export default function AdminMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingMeeting, setEditingMeeting] = useState<EditingMeeting | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await api.get<Meeting[]>("/api/admin/meetings")
      setMeetings(response.data)
    } catch (error) {
      console.error("Failed to fetch meetings:", error)
      setError("Nie udało się załadować spotkań. Spróbuj ponownie później.")
    } finally {
      setLoading(false)
    }
  }

  const addMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const meeting = {
      title: formData.get("title"),
      description: formData.get("description"),
      date: formData.get("date"),
      location: formData.get("location"),
      link: formData.get("link") || undefined
    }

    try {
      const response = await api.post<Meeting>("/api/admin/meetings", meeting)
      setMeetings([...meetings, response.data])
      form.reset()
    } catch (error) {
      console.error("Error adding meeting:", error)
      setError("Nie udało się dodać spotkania. Spróbuj ponownie później.")
    }
  }

  const deleteMeeting = async (id: number) => {
    try {
      await api.delete(`/api/admin/meetings/${id}`)
      setMeetings(meetings.filter(meeting => meeting.id !== id))
    } catch (error) {
      console.error("Error deleting meeting:", error)
      setError("Nie udało się usunąć spotkania. Spróbuj ponownie później.")
    }
  }

  const startEditing = (meeting: Meeting) => {
    setEditingMeeting({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      location: meeting.location,
      link: meeting.link
    })
  }

  const cancelEditing = () => {
    setEditingMeeting(null)
  }

  const updateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMeeting) return

    try {
      const response = await api.put<Meeting>(`/api/admin/meetings/${editingMeeting.id}`, editingMeeting)
      setMeetings(meetings.map(meeting => meeting.id === editingMeeting.id ? response.data : meeting))
      setEditingMeeting(null)
    } catch (error) {
      console.error("Error updating meeting:", error)
      setError("Nie udało się zaktualizować spotkania. Spróbuj ponownie później.")
    }
  }

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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 glitch">Zarządzanie Spotkaniami</h1>

        <form onSubmit={addMeeting} className="mb-8 neon-box p-4">
          <h2 className="text-xl mb-4">Dodaj nowe spotkanie</h2>
          <div className="space-y-4">
            <input
              type="text"
              name="title"
              placeholder="Tytuł spotkania"
              className="w-full bg-black border border-gray-800 p-2"
              required
            />
            <textarea
              name="description"
              placeholder="Opis spotkania"
              className="w-full bg-black border border-gray-800 p-2"
              required
            />
            <input
              type="datetime-local"
              name="date"
              className="w-full bg-black border border-gray-800 p-2"
              required
            />
            <input
              type="text"
              name="location"
              placeholder="Lokalizacja"
              className="w-full bg-black border border-gray-800 p-2"
              required
            />
            <input
              type="url"
              name="link"
              placeholder="Link do spotkania (opcjonalnie)"
              className="w-full bg-black border border-gray-800 p-2"
            />
            <AnimatedButton type="submit">Dodaj</AnimatedButton>
          </div>
        </form>

        <div className="neon-box p-4">
          <h2 className="text-xl mb-4">Lista spotkań</h2>
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="border-b border-gray-800 py-4 last:border-b-0">
                {editingMeeting?.id === meeting.id ? (
                  <form onSubmit={updateMeeting} className="space-y-4">
                    <input
                      type="text"
                      value={editingMeeting.title}
                      onChange={(e) => setEditingMeeting({ ...editingMeeting, title: e.target.value })}
                      className="w-full bg-black border border-gray-800 p-2"
                      required
                    />
                    <textarea
                      value={editingMeeting.description}
                      onChange={(e) => setEditingMeeting({ ...editingMeeting, description: e.target.value })}
                      className="w-full bg-black border border-gray-800 p-2"
                      required
                    />
                    <input
                      type="datetime-local"
                      value={editingMeeting.date}
                      onChange={(e) => setEditingMeeting({ ...editingMeeting, date: e.target.value })}
                      className="w-full bg-black border border-gray-800 p-2"
                      required
                    />
                    <input
                      type="text"
                      value={editingMeeting.location}
                      onChange={(e) => setEditingMeeting({ ...editingMeeting, location: e.target.value })}
                      className="w-full bg-black border border-gray-800 p-2"
                      required
                    />
                    <input
                      type="url"
                      value={editingMeeting.link || ""}
                      onChange={(e) => setEditingMeeting({ ...editingMeeting, link: e.target.value || undefined })}
                      placeholder="Link do spotkania (opcjonalnie)"
                      className="w-full bg-black border border-gray-800 p-2"
                    />
                    <div className="flex justify-end space-x-2">
                      <AnimatedButton type="button" onClick={cancelEditing} className="bg-red-500">
                        Anuluj
                      </AnimatedButton>
                      <AnimatedButton type="submit">
                        Zapisz
                      </AnimatedButton>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{meeting.title}</h3>
                        <p className="text-sm">{meeting.description}</p>
                        <p className="text-sm text-gray-400">
                          Data: {new Date(meeting.date).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400">
                          Lokalizacja: {meeting.location}
                        </p>
                        {meeting.link && (
                          <p className="text-sm text-gray-400">
                            Link: <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">{meeting.link}</a>
                          </p>
                        )}
                      </div>
                      <div className="space-x-2">
                        <AnimatedButton onClick={() => startEditing(meeting)}>
                          Edytuj
                        </AnimatedButton>
                        <AnimatedButton onClick={() => deleteMeeting(meeting.id)} className="bg-red-500">
                          Usuń
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

