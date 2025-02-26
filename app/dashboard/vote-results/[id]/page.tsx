"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"

interface Question {
  id: number
  question: string
  description?: string
  type: "single" | "multiple" | "text" | "scale"
  options?: string[]
  optionDescriptions?: string[]
  min?: number
  max?: number
  step?: number
  labels?: { [key: number]: string }
}

interface UserResponse {
  question_id: number
  question: string
  type: "single" | "multiple" | "text" | "scale"
  response_data: {
    type: "single" | "multiple" | "text" | "scale"
    selected_option?: number
    selected_options?: number[]
    text?: string
    value?: number
  }
}

interface Poll {
  id: number
  title: string
  description: string
  questions: Question[]
  active: boolean
  created_at: string
  expires_at?: string
  is_system_post?: boolean
}

interface PollResponse {
  poll_id: number
  poll_title: string
  user_responses: UserResponse[]
}

interface Toast {
  message: string
  type: "success" | "error"
}

export default function VoteResultsPage({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [pollResponse, setPollResponse] = useState<PollResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState<Toast | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [pollRes, userResponsesRes] = await Promise.all([
          api.get<Poll>(`/api/votes/${params.id}`),
          api.get<PollResponse>(`/api/votes/${params.id}/user-responses`)
        ])
        setPoll(pollRes.data)
        setPollResponse(userResponsesRes.data)
      } catch (err) {
        console.error("Failed to fetch data:", err)
        setError("Nie udało się załadować danych. Spróbuj ponownie później.")
        showToast("Nie udało się załadować danych", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  if (!user) {
    router.push("/login")
    return null
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="text-center">Ładowanie...</div>
      </PageTransition>
    )
  }

  if (error || !poll || !pollResponse) {
    return (
      <PageTransition>
        <div className="text-red-500 text-center">{error || "Nie znaleziono odpowiedzi"}</div>
      </PageTransition>
    )
  }

  const renderResponse = (question: Question, response: UserResponse) => {
    switch (response.type) {
      case "single":
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div
                key={index}
                className={`p-4 border rounded transition-colors ${
                  response.response_data.selected_option === index
                    ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10"
                    : "border-gray-800 text-gray-400"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{option}</span>
                  {response.response_data.selected_option === index && (
                    <span className="text-[#39FF14]">✓ Twój wybór</span>
                  )}
                </div>
                {question.optionDescriptions?.[index] && (
                  <p className="text-sm text-gray-500 mt-1">
                    {question.optionDescriptions[index]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )

      case "multiple":
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div
                key={index}
                className={`p-4 border rounded transition-colors ${
                  response.response_data.selected_options?.includes(index)
                    ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10"
                    : "border-gray-800 text-gray-400"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{option}</span>
                  {response.response_data.selected_options?.includes(index) && (
                    <span className="text-[#39FF14]">✓ Twój wybór</span>
                  )}
                </div>
                {question.optionDescriptions?.[index] && (
                  <p className="text-sm text-gray-500 mt-1">
                    {question.optionDescriptions[index]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )

      case "text":
        return (
          <div className="space-y-2">
            <div className="p-4 border border-[#39FF14] rounded bg-[#39FF14]/10">
              <p className="text-[#39FF14] mb-2">Twoja odpowiedź:</p>
              <p className="whitespace-pre-wrap">{response.response_data.text || "Brak odpowiedzi"}</p>
            </div>
          </div>
        )

      case "scale":
        const value = response.response_data.value
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-400">
              <span>{question.labels?.[question.min || 0] || question.min}</span>
              <span>{question.labels?.[question.max || 5] || question.max}</span>
            </div>
            <div className="relative pt-2">
              <div className="w-full h-2 bg-gray-800 rounded">
                <div
                  className="h-2 bg-[#39FF14] rounded transition-all"
                  style={{
                    width: `${((value || 0) - (question.min || 0)) / ((question.max || 5) - (question.min || 0)) * 100}%`
                  }}
                />
              </div>
              <div
                className="absolute top-0 -mt-1 w-4 h-4 bg-[#39FF14] rounded-full shadow"
                style={{
                  left: `calc(${((value || 0) - (question.min || 0)) / ((question.max || 5) - (question.min || 0)) * 100}% - 0.5rem)`
                }}
              />
            </div>
            <p className="text-center text-[#39FF14]">
              Wybrana wartość: {value}
              {question.labels?.[value || 0] && ` (${question.labels[value || 0]})`}
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4">
        {toast && (
          <div
            className={`fixed top-4 right-4 p-4 rounded shadow-lg animate-fade-in ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold glitch">Twoje odpowiedzi</h1>
          <AnimatedButton onClick={() => router.push("/dashboard/ankiety")}>
            Powrót
          </AnimatedButton>
        </div>

        <div className="neon-box p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">{poll.title}</h2>
          <p className="text-gray-300 mb-4">{poll.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <p>Status: {poll.active ? "Aktywna" : "Nieaktywna"}</p>
            <p>Utworzono: {new Date(poll.created_at).toLocaleString("pl-PL")}</p>
            {poll.expires_at && (
              <p>Wygasa: {new Date(poll.expires_at).toLocaleString("pl-PL")}</p>
            )}
            <p>Liczba pytań: {poll.questions.length}</p>
          </div>
        </div>

        <div className="space-y-6">
          {pollResponse.user_responses.map((response, index) => {
            const question = poll.questions.find(q => q.id === response.question_id)
            if (!question) return null

            return (
              <div key={response.question_id} className="neon-box p-6">
                <h3 className="text-xl font-semibold mb-2">
                  Pytanie {index + 1}: {question.question}
                </h3>
                {question.description && (
                  <p className="text-gray-400 mb-4">{question.description}</p>
                )}
                {renderResponse(question, response)}
              </div>
            )
          })}
        </div>
      </div>
    </PageTransition>
  )
} 