"use client"

import type React from "react"
import { useState, useEffect } from "react"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { useRouter } from "next/navigation"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

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
  description?: string
}

type Question = SingleChoiceQuestion | MultipleChoiceQuestion | TextQuestion | ScaleQuestion

interface SingleChoiceResult {
  type: "single"
  results: { [key: string]: number }
}

interface MultipleChoiceResult {
  type: "multiple"
  results: { [key: string]: number }
}

interface TextResult {
  type: "text"
  responses: string[]
}

interface ScaleResult {
  type: "scale"
  distribution: { [key: number]: number }
  average: number
}

type QuestionResult = SingleChoiceResult | MultipleChoiceResult | TextResult | ScaleResult

interface Poll {
  id: number
  title: string
  description: string
  questions: Question[]
  is_active: boolean
  created_at: string
  expires_at?: string
  is_system_post?: boolean
}

interface PollResults {
  id: number
  results: QuestionResult[]
  total_votes: number
}

interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export default function AdminPolls() {
  const initialQuestion: SingleChoiceQuestion = {
    type: "single",
    question: "",
    description: "",
    options: ["", ""],
    optionDescriptions: ["", ""]
  }

  const [polls, setPolls] = useState<Poll[]>([])
  const [pollResults, setPollResults] = useState<{ [key: number]: PollResults }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreator, setShowCreator] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([initialQuestion])
  const [pollTitle, setPollTitle] = useState("")
  const [pollDescription, setPollDescription] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [isSystemPost, setIsSystemPost] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [showToast, setShowToast] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchPolls()
  }, [])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const showSuccessToast = (message: string) => {
    setToastMessage(message)
    setToastType("success")
    setShowToast(true)
  }

  const showErrorToast = (message: string) => {
    setToastMessage(message)
    setToastType("error")
    setShowToast(true)
  }

  const fetchPolls = async () => {
    try {
      setLoading(true)
      const response = await api.get<PaginatedResponse<Poll>>("/api/admin/polls")
      setPolls(response.data.data)
      for (const poll of response.data.data) {
        const resultsResponse = await api.get<PollResults>(`/api/admin/polls/results/${poll.id}`)
        setPollResults(prev => ({ ...prev, [poll.id]: resultsResponse.data }))
      }
    } catch (error) {
      console.error("Failed to fetch polls:", error)
      setError("Nie udało się załadować ankiet. Spróbuj ponownie później.")
      showErrorToast("Nie udało się załadować ankiet")
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = (type: ResponseType) => {
    let newQuestion: Question
    switch (type) {
      case "single":
        newQuestion = { type: "single", question: "", description: "", options: ["", ""], optionDescriptions: ["", ""] }
        break
      case "multiple":
        newQuestion = { type: "multiple", question: "", description: "", options: ["", ""], optionDescriptions: ["", ""], maxChoices: 2 }
        break
      case "text":
        newQuestion = { type: "text", question: "", description: "", maxLength: 500, placeholder: "" }
        break
      case "scale":
        newQuestion = {
          type: "scale",
          question: "",
          description: "",
          min: 1,
          max: 5,
          step: 1,
          labels: { 1: "Najniższa", 5: "Najwyższa" }
        }
        break
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], ...updates }
    setQuestions(newQuestions)
  }

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex]
    if ('options' in question) {
      const newQuestions = [...questions]
      ;(newQuestions[questionIndex] as SingleChoiceQuestion | MultipleChoiceQuestion).options.push("")
      setQuestions(newQuestions)
    }
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex]
    if ('options' in question) {
      const newQuestions = [...questions]
      const choiceQuestion = newQuestions[questionIndex] as SingleChoiceQuestion | MultipleChoiceQuestion
      choiceQuestion.options = choiceQuestion.options.filter((_, i) => i !== optionIndex)
      setQuestions(newQuestions)
    }
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex]
    if ('options' in question) {
      const newQuestions = [...questions]
      const choiceQuestion = newQuestions[questionIndex] as SingleChoiceQuestion | MultipleChoiceQuestion
      choiceQuestion.options[optionIndex] = value
      setQuestions(newQuestions)
    }
  }

  const changeQuestionType = (index: number, newType: ResponseType): void => {
    setQuestions(questions => {
      const newQuestions = [...questions];
      const currentQuestion = questions[index];
      const questionText = currentQuestion.question;

      let newQuestion: Question;
      
      if (newType === 'single') {
        newQuestion = {
          type: 'single',
          question: questionText,
          description: currentQuestion.description,
          options: 'options' in currentQuestion ? [...currentQuestion.options] : ['', ''],
          optionDescriptions: 'optionDescriptions' in currentQuestion ? [...currentQuestion.optionDescriptions] : ['', '']
        } as SingleChoiceQuestion;
      } else if (newType === 'multiple') {
        newQuestion = {
          type: 'multiple',
          question: questionText,
          description: currentQuestion.description,
          options: 'options' in currentQuestion ? [...currentQuestion.options] : ['', ''],
          optionDescriptions: 'optionDescriptions' in currentQuestion ? [...currentQuestion.optionDescriptions] : ['', ''],
          maxChoices: 2
        } as MultipleChoiceQuestion;
      } else if (newType === 'text') {
        newQuestion = {
          type: 'text',
          question: questionText,
          description: currentQuestion.description,
          maxLength: 500,
          placeholder: currentQuestion.placeholder
        } as TextQuestion;
      } else {
        newQuestion = {
          type: 'scale',
          question: questionText,
          description: currentQuestion.description,
          min: 1,
          max: 5,
          step: 1,
          labels: { 1: 'Najniższa', 5: 'Najwyższa' }
        } as ScaleQuestion;
      }

      newQuestions[index] = newQuestion;
      return newQuestions;
    });
  };

  const renderQuestionEditor = (question: Question, index: number) => {
    const baseFields = (
      <>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg">Pytanie {index + 1}</h3>
          {index > 0 && (
            <AnimatedButton onClick={() => removeQuestion(index)} className="bg-red-500">
              Usuń pytanie
            </AnimatedButton>
          )}
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <input
              type="text"
              value={question.question}
              onChange={(e) => updateQuestion(index, { question: e.target.value })}
              placeholder="Treść pytania"
              className="w-full bg-black border border-gray-800 p-2"
              required
            />
          </div>
          
          <div>
            <textarea
              value={question.description || ""}
              onChange={(e) => updateQuestion(index, { description: e.target.value })}
              placeholder="Opis pytania (opcjonalnie)"
              className="w-full bg-black border border-gray-800 p-2 min-h-[80px]"
            />
          </div>

          <div>
            <select
              value={question.type}
              onChange={(e) => changeQuestionType(index, e.target.value as ResponseType)}
              className="w-full bg-black border border-gray-800 p-2"
            >
              <option value="single">Jednokrotny wybór</option>
              <option value="multiple">Wielokrotny wybór</option>
              <option value="text">Pytanie otwarte</option>
              <option value="scale">Skala</option>
            </select>
          </div>
        </div>
      </>
    )

    switch (question.type) {
      case "single":
      case "multiple":
        return (
          <div className="mb-8 p-4 border border-gray-800 rounded">
            {baseFields}
            
            {question.type === "multiple" && (
              <div className="mb-4">
                <label className="block mb-2">Maksymalna liczba wyborów:</label>
                <input
                  type="number"
                  min="1"
                  max={question.options.length}
                  value={question.maxChoices}
                  onChange={(e) => updateQuestion(index, { maxChoices: parseInt(e.target.value) })}
                  className="w-full bg-black border border-gray-800 p-2"
                />
              </div>
            )}

            <div className="space-y-4 mb-4">
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, oIndex, e.target.value)}
                      placeholder={`Opcja ${oIndex + 1}`}
                      className="flex-grow bg-black border border-gray-800 p-2"
                      required
                    />
                    {oIndex > 1 && (
                      <AnimatedButton
                        onClick={() => removeOption(index, oIndex)}
                        className="bg-red-500"
                      >
                        Usuń
                      </AnimatedButton>
                    )}
                  </div>
                  <textarea
                    value={question.optionDescriptions?.[oIndex] || ""}
                    onChange={(e) => {
                      const newDescriptions = [...(question.optionDescriptions || [])]
                      newDescriptions[oIndex] = e.target.value
                      updateQuestion(index, { optionDescriptions: newDescriptions })
                    }}
                    placeholder={`Opis opcji ${oIndex + 1} (opcjonalnie)`}
                    className="w-full bg-black border border-gray-800 p-2"
                  />
                </div>
              ))}
            </div>

            <AnimatedButton
              type="button"
              onClick={() => addOption(index)}
              className="w-full mb-2"
            >
              Dodaj opcję
            </AnimatedButton>
          </div>
        )

      case "text":
        return (
          <div className="mb-8 p-4 border border-gray-800 rounded">
            {baseFields}
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Maksymalna długość odpowiedzi:</label>
                <input
                  type="number"
                  min="1"
                  value={question.maxLength}
                  onChange={(e) => updateQuestion(index, { maxLength: parseInt(e.target.value) })}
                  className="w-full bg-black border border-gray-800 p-2"
                />
              </div>
              <div>
                <label className="block mb-2">Placeholder:</label>
                <input
                  type="text"
                  value={question.placeholder || ""}
                  onChange={(e) => updateQuestion(index, { placeholder: e.target.value })}
                  placeholder="Tekst podpowiedzi dla użytkownika"
                  className="w-full bg-black border border-gray-800 p-2"
                />
              </div>
            </div>
          </div>
        )

      case "scale":
        return (
          <div className="mb-8 p-4 border border-gray-800 rounded">
            {baseFields}
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-2">Minimum:</label>
                <input
                  type="number"
                  value={question.min}
                  onChange={(e) => updateQuestion(index, { min: parseInt(e.target.value) })}
                  className="w-full bg-black border border-gray-800 p-2"
                />
              </div>
              <div>
                <label className="block mb-2">Maximum:</label>
                <input
                  type="number"
                  value={question.max}
                  onChange={(e) => updateQuestion(index, { max: parseInt(e.target.value) })}
                  className="w-full bg-black border border-gray-800 p-2"
                />
              </div>
              <div>
                <label className="block mb-2">Krok:</label>
                <input
                  type="number"
                  min="1"
                  value={question.step}
                  onChange={(e) => updateQuestion(index, { step: parseInt(e.target.value) })}
                  className="w-full bg-black border border-gray-800 p-2"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Etykiety (opcjonalne):</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    value={question.labels?.[question.min] || ""}
                    onChange={(e) => updateQuestion(index, {
                      labels: { ...question.labels, [question.min]: e.target.value }
                    })}
                    placeholder="Etykieta dla minimum"
                    className="w-full bg-black border border-gray-800 p-2"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={question.labels?.[question.max] || ""}
                    onChange={(e) => updateQuestion(index, {
                      labels: { ...question.labels, [question.max]: e.target.value }
                    })}
                    placeholder="Etykieta dla maximum"
                    className="w-full bg-black border border-gray-800 p-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  const addPoll = async (e: React.FormEvent) => {
    e.preventDefault()
    const validQuestions = questions.filter(q => {
      if (!q.question.trim()) return false
      if (q.type === "single" || q.type === "multiple") {
        return q.options.filter(Boolean).length >= 2
      }
      return true
    })

    if (validQuestions.length === 0) {
      showErrorToast("Dodaj przynajmniej jedno pytanie")
      return
    }

    try {
      const response = await api.post<Poll>("/api/admin/polls", {
        title: pollTitle,
        description: pollDescription,
        questions: validQuestions,
        is_active: isActive,
        expires_at: expiresAt || null,
        is_system_post: isSystemPost
      })
      
      // Reset form
      setPollTitle("")
      setPollDescription("")
      setExpiresAt("")
      setQuestions([initialQuestion])
      setIsSystemPost(false)
      setIsActive(true)
      setShowCreator(false)
      setError("")
      
      showSuccessToast("Ankieta została utworzona pomyślnie")
      
      // Refresh polls list
      await fetchPolls()
    } catch (error: any) {
      console.error("Error adding polls:", error)
      showErrorToast(error.response?.data?.message || "Nie udało się dodać ankiety. Spróbuj ponownie później.")
    }
  }

  const deletePoll = async (id: number) => {
    try {
      await api.delete(`/api/admin/polls/${id}`)
      setPolls(polls.filter(poll => poll.id !== id))
    } catch (error) {
      console.error("Error deleting poll:", error)
      setError("Nie udało się usunąć ankiety. Spróbuj ponownie później.")
    }
  }

  const togglePollStatus = async (id: number, is_active: boolean) => {
    try {
      const response = await api.patch<{ message: string, is_active: boolean }>(`/api/admin/polls/${id}/toggle-active`)
      showSuccessToast(response.data.message)
      
      // Refresh the polls list to get the latest status
      await fetchPolls()
    } catch (error: any) {
      console.error("Error toggling poll status:", error)
      showErrorToast(error.response?.data?.message || "Nie udało się zmienić statusu ankiety. Spróbuj ponownie później.")
    }
  }

  if (!user) {
    window.location.href = "/login"
    return null
  }

  if (loading) {
    return <div>Ładowanie...</div>
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 glitch">Zarządzanie Ankietami</h1>

        {/* Toast Notification */}
        {showToast && (
          <div
            className={`fixed top-4 right-4 p-4 rounded shadow-lg transition-all duration-300 ${
              toastType === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {toastMessage}
          </div>
        )}

        {!showCreator ? (
          <AnimatedButton onClick={() => setShowCreator(true)} className="mb-8">
            Stwórz nową ankietę
          </AnimatedButton>
        ) : (
          <form onSubmit={addPoll} className="mb-8 neon-box p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl">Kreator ankiet</h2>
              <AnimatedButton onClick={() => setShowCreator(false)} className="bg-red-500">
                Anuluj
              </AnimatedButton>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="pollTitle" className="block mb-2">Tytuł ankiety</label>
                <input
                  type="text"
                  id="pollTitle"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  className="w-full bg-black border border-gray-800 p-2"
                  required
                />
              </div>

              <div>
                <label htmlFor="pollDescription" className="block mb-2">Opis ankiety</label>
                <textarea
                  id="pollDescription"
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                  className="w-full bg-black border border-gray-800 p-2 min-h-[100px]"
                  required
                />
              </div>

              <div>
                <label htmlFor="expiresAt" className="block mb-2">Data wygaśnięcia (opcjonalnie)</label>
                <input
                  type="datetime-local"
                  id="expiresAt"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-black border border-gray-800 p-2"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSystemPost"
                  checked={isSystemPost}
                  onChange={(e) => setIsSystemPost(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isSystemPost">Post systemowy</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isActive">Aktywna</label>
              </div>
            </div>

            {questions.map((q, index) => renderQuestionEditor(q, index))}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <AnimatedButton type="button" onClick={() => addQuestion("single")}>
                Dodaj pytanie jednokrotnego wyboru
              </AnimatedButton>
              <AnimatedButton type="button" onClick={() => addQuestion("multiple")}>
                Dodaj pytanie wielokrotnego wyboru
              </AnimatedButton>
              <AnimatedButton type="button" onClick={() => addQuestion("text")}>
                Dodaj pytanie otwarte
              </AnimatedButton>
              <AnimatedButton type="button" onClick={() => addQuestion("scale")}>
                Dodaj skalę
              </AnimatedButton>
            </div>

            <AnimatedButton type="submit" className="w-full">
              Zapisz ankietę
            </AnimatedButton>
          </form>
        )}

        <div className="neon-box p-4">
          <h2 className="text-xl mb-4">Lista ankiet</h2>
          {error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : polls.length === 0 ? (
            <p className="text-center text-gray-400">Brak ankiet</p>
          ) : (
            <div className="space-y-8">
              {polls.map((poll) => (
                <div key={poll.id} className="border-b border-gray-800 py-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{poll.title}</h3>
                      <p className="text-gray-300 mb-2">{poll.description}</p>
                      <p className="text-sm text-gray-400">
                        Utworzono: {new Date(poll.created_at).toLocaleDateString()}
                      </p>
                      {poll.expires_at && (
                        <p className="text-sm text-gray-400">
                          Wygasa: {new Date(poll.expires_at).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-sm text-gray-400">
                        Status: {poll.is_active ? "Aktywna" : "Nieaktywna"}
                      </p>
                      {pollResults[poll.id] && (
                        <p className="text-sm text-gray-400">
                          Liczba odpowiedzi: {pollResults[poll.id].total_votes}
                        </p>
                      )}
                    </div>
                    <div className="space-x-2">
                      <AnimatedButton
                        onClick={() => router.push(`/admin/polls/${poll.id}`)}
                        className="bg-blue-500"
                      >
                        Statystyki
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={() => togglePollStatus(poll.id, poll.is_active)}
                        className={poll.is_active ? "bg-green-500" : "bg-yellow-500"}
                      >
                        {poll.is_active ? "Dezaktywuj" : "Aktywuj"}
                      </AnimatedButton>
                      <AnimatedButton onClick={() => deletePoll(poll.id)} className="bg-red-500">
                        Usuń
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

