"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"

type ResponseType = "single" | "multiple" | "text" | "scale"

interface BaseQuestion {
  question: string
  description?: string
}

interface SingleChoiceQuestion extends BaseQuestion {
  type: "single"
  options: string[]
  optionDescriptions?: string[]
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple"
  options: string[]
  optionDescriptions?: string[]
  maxChoices?: number
}

interface TextQuestion extends BaseQuestion {
  type: "text"
  maxLength?: number
  placeholder?: string
}

interface ScaleQuestion extends BaseQuestion {
  type: "scale"
  min: number
  max: number
  step: number
  labels?: { [key: number]: string }
}

type Question = SingleChoiceQuestion | MultipleChoiceQuestion | TextQuestion | ScaleQuestion

interface Poll {
  id: number
  title: string
  description: string
  questions: Question[]
  active: boolean
  created_at: string
  expires_at?: string
  is_system_post?: boolean
  has_voted?: boolean
}

interface SingleChoiceResponse {
  type: "single"
  selected_option: number
}

interface MultipleChoiceResponse {
  type: "multiple"
  selected_options: number[]
}

interface TextResponse {
  type: "text"
  text: string
}

interface ScaleResponse {
  type: "scale"
  value: number
}

type QuestionResponse = SingleChoiceResponse | MultipleChoiceResponse | TextResponse | ScaleResponse

interface UserResponse {
  question_index: number
  response: QuestionResponse
}

interface Toast {
  message: string
  type: "success" | "error"
}

export default function VotePage({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [userResponses, setUserResponses] = useState<UserResponse[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [responses, setResponses] = useState<QuestionResponse[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const [toast, setToast] = useState<Toast | null>(null)

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
    const fetchPoll = async () => {
      try {
        setLoading(true)
        const [pollResponse, userResponsesResponse] = await Promise.all([
          api.get<Poll>(`/api/votes/${params.id}`),
          api.get<{ responses: UserResponse[] }>(`/api/votes/${params.id}/user-responses`)
        ])
        
        setPoll(pollResponse.data)
        setUserResponses(userResponsesResponse.data.responses)
        
        // Only initialize responses if user hasn't voted yet
        if (!userResponsesResponse.data.responses) {
          setResponses(pollResponse.data.questions.map(q => {
            switch (q.type) {
              case "single":
                return { type: "single", selected_option: -1 }
              case "multiple":
                return { type: "multiple", selected_options: [] }
              case "text":
                return { type: "text", text: "" }
              case "scale":
                return { type: "scale", value: (q as ScaleQuestion).min }
            }
          }))
        }
      } catch (err) {
        console.error("Failed to fetch poll:", err)
        setError("Nie udało się załadować ankiety. Spróbuj ponownie później.")
        showToast("Nie udało się załadować ankiety", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchPoll()
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

  if (error || !poll) {
    return (
      <PageTransition>
        <div className="text-red-500 text-center">{error || "Nie znaleziono ankiety"}</div>
      </PageTransition>
    )
  }

  const handleSingleChoice = (optionIndex: number) => {
    const newResponses = [...responses]
    newResponses[currentQuestion] = { type: "single", selected_option: optionIndex }
    setResponses(newResponses)
  }

  const handleMultipleChoice = (optionIndex: number) => {
    const response = responses[currentQuestion] as MultipleChoiceResponse
    const question = poll.questions[currentQuestion] as MultipleChoiceQuestion
    const maxChoices = question.maxChoices || question.options.length

    const newResponses = [...responses]
    const currentOptions = [...response.selected_options]
    
    const optionIndex_ = currentOptions.indexOf(optionIndex)
    if (optionIndex_ === -1) {
      if (currentOptions.length < maxChoices) {
        currentOptions.push(optionIndex)
      }
    } else {
      currentOptions.splice(optionIndex_, 1)
    }
    
    newResponses[currentQuestion] = { type: "multiple", selected_options: currentOptions }
    setResponses(newResponses)
  }

  const handleTextResponse = (text: string) => {
    const newResponses = [...responses]
    newResponses[currentQuestion] = { type: "text", text }
    setResponses(newResponses)
  }

  const handleScaleResponse = (value: number) => {
    const newResponses = [...responses]
    newResponses[currentQuestion] = { type: "scale", value }
    setResponses(newResponses)
  }

  const isResponseValid = (response: QuestionResponse, question: Question): boolean => {
    switch (response.type) {
      case "single":
        return response.selected_option >= 0
      case "multiple":
        return response.selected_options.length > 0
      case "text":
        const maxLength = (question as TextQuestion).maxLength || 500
        return response.text.length > 0 && response.text.length <= maxLength
      case "scale":
        const scaleQuestion = question as ScaleQuestion
        return response.value >= scaleQuestion.min && response.value <= scaleQuestion.max
    }
  }

  const handleSubmit = async () => {
    if (!poll) return

    // Validate all responses
    const allValid = responses.every((response, index) => 
      isResponseValid(response, poll.questions[index])
    )

    if (!allValid) {
      setError("Proszę odpowiedzieć na wszystkie pytania")
      showToast("Proszę odpowiedzieć na wszystkie pytania", "error")
      return
    }

    try {
      setSubmitting(true)
      await api.post(`/api/votes/${poll.id}`, {
        responses: responses.map((response, index) => ({
          question_index: index,
          response
        }))
      })
      showToast("Odpowiedzi zostały zapisane", "success")
      router.push("/dashboard/ankiety")
      router.push("/dashboard/glosowania")
    } catch (err) {
      console.error("Failed to submit vote:", err)
      setError("Nie udało się zapisać odpowiedzi. Spróbuj ponownie później.")
      showToast("Nie udało się zapisać odpowiedzi", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const currentQ = poll.questions[currentQuestion]

  const renderQuestion = () => {
    const response = userResponses 
      ? userResponses.find(r => r.question_index === currentQuestion)?.response
      : responses[currentQuestion]

    if (!response) return null

    const isReadOnly = !!userResponses

    switch (currentQ.type) {
      case "single":
        return (
          <div className="space-y-4">
            {currentQ.options.map((option, index) => (
              <div key={index} className="space-y-2">
                <button
                  onClick={() => !isReadOnly && handleSingleChoice(index)}
                  disabled={isReadOnly}
                  className={`w-full text-left p-4 border ${
                    (response as SingleChoiceResponse).selected_option === index
                      ? "border-[#39FF14] text-[#39FF14]"
                      : isReadOnly
                        ? "border-gray-800 text-gray-400"
                        : "border-gray-800 hover:border-[#39FF14] hover:text-[#39FF14]"
                  } transition-colors`}
                >
                  {option}
                  {isReadOnly && (response as SingleChoiceResponse).selected_option === index && (
                    <span className="ml-2 text-[#39FF14]">✓ Twój wybór</span>
                  )}
                </button>
                {currentQ.optionDescriptions?.[index] && (
                  <p className="text-sm text-gray-400 px-4">
                    {currentQ.optionDescriptions[index]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )

      case "multiple":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Maksymalna liczba wyborów: {currentQ.maxChoices || currentQ.options.length}
            </p>
            {currentQ.options.map((option, index) => (
              <div key={index} className="space-y-2">
                <button
                  onClick={() => !isReadOnly && handleMultipleChoice(index)}
                  disabled={isReadOnly}
                  className={`w-full text-left p-4 border ${
                    (response as MultipleChoiceResponse).selected_options.includes(index)
                      ? "border-[#39FF14] text-[#39FF14]"
                      : isReadOnly
                        ? "border-gray-800 text-gray-400"
                        : "border-gray-800 hover:border-[#39FF14] hover:text-[#39FF14]"
                  } transition-colors`}
                >
                  {option}
                  {isReadOnly && (response as MultipleChoiceResponse).selected_options.includes(index) && (
                    <span className="ml-2 text-[#39FF14]">✓ Twój wybór</span>
                  )}
                </button>
                {currentQ.optionDescriptions?.[index] && (
                  <p className="text-sm text-gray-400 px-4">
                    {currentQ.optionDescriptions[index]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )

      case "text":
        return (
          <div className="space-y-4">
            <textarea
              value={(response as TextResponse).text}
              onChange={(e) => !isReadOnly && handleTextResponse(e.target.value)}
              placeholder={currentQ.placeholder}
              maxLength={currentQ.maxLength}
              disabled={isReadOnly}
              className={`w-full bg-black border border-gray-800 p-4 min-h-[200px] ${
                isReadOnly 
                  ? "text-[#39FF14]" 
                  : "focus:border-[#39FF14] focus:outline-none"
              } transition-colors`}
            />
            {isReadOnly && (
              <p className="text-sm text-[#39FF14]">✓ Twoja odpowiedź</p>
            )}
            {currentQ.maxLength && !isReadOnly && (
              <p className="text-sm text-gray-400">
                Pozostało znaków: {currentQ.maxLength - (response as TextResponse).text.length}
              </p>
            )}
          </div>
        )

      case "scale":
        return (
          <div className="space-y-6">
            <div className="flex justify-between text-sm text-gray-400">
              <span>{currentQ.labels?.[currentQ.min] || currentQ.min}</span>
              <span>{currentQ.labels?.[currentQ.max] || currentQ.max}</span>
            </div>
            <input
              type="range"
              min={currentQ.min}
              max={currentQ.max}
              step={currentQ.step}
              value={(response as ScaleResponse).value}
              onChange={(e) => !isReadOnly && handleScaleResponse(parseInt(e.target.value))}
              disabled={isReadOnly}
              className={`w-full ${isReadOnly ? "opacity-50" : ""}`}
            />
            <p className="text-center">
              Wybrana wartość: {(response as ScaleResponse).value}
              {currentQ.labels?.[(response as ScaleResponse).value] && 
                ` (${currentQ.labels[(response as ScaleResponse).value]})`
              }
              {isReadOnly && (
                <span className="ml-2 text-[#39FF14]">✓ Twój wybór</span>
              )}
            </p>
          </div>
        )
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

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold glitch">{poll.title}</h1>
            <AnimatedButton onClick={() => router.push("/dashboard/ankiety")}>
              Powrót
            </AnimatedButton>
          </div>
          <div className="neon-box p-6">
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
          {userResponses && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500 rounded">
              <p className="text-green-500">
                Już oddałeś głos w tej ankiecie. Możesz przeglądać swoje odpowiedzi.
              </p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Pytanie {currentQuestion + 1} z {poll.questions.length}
            </h2>
            <div className="text-sm text-gray-400">
              {Math.round(((currentQuestion + 1) / poll.questions.length) * 100)}%
            </div>
          </div>
          <div className="w-full bg-gray-800 h-2 mb-8">
            <div
              className="bg-[#39FF14] h-2 transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / poll.questions.length) * 100}%`,
              }}
            />
          </div>

          <div className="neon-box p-6 mb-8">
            <h3 className="text-xl font-semibold mb-2">{currentQ.question}</h3>
            {currentQ.description && (
              <p className="text-gray-400 mb-4">{currentQ.description}</p>
            )}
            {renderQuestion()}
          </div>

          <div className="flex justify-between">
            <AnimatedButton
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              disabled={currentQuestion === 0}
            >
              Poprzednie
            </AnimatedButton>
            {!userResponses && currentQuestion === poll.questions.length - 1 ? (
              <AnimatedButton
                onClick={handleSubmit}
                disabled={submitting || !isResponseValid(responses[currentQuestion], currentQ)}
              >
                {submitting ? "Zapisywanie..." : "Zakończ"}
              </AnimatedButton>
            ) : (
              <AnimatedButton
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={!userResponses && !isResponseValid(responses[currentQuestion], currentQ)}
              >
                Następne
              </AnimatedButton>
            )}
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-center mb-4">{error}</div>
        )}
      </div>
    </PageTransition>
  )
}

