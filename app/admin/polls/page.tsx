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
  type: ResponseType
}

interface SingleChoiceQuestion extends BaseQuestion {
  type: "single"
  options: string[]
  optionDescriptions: string[]
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple"
  options: string[]
  optionDescriptions: string[]
  maxChoices: number
}

interface TextQuestion extends BaseQuestion {
  type: "text"
  maxLength: number
  placeholder: string
}

interface ScaleQuestion extends BaseQuestion {
  type: "scale"
  min: number
  max: number
  step: number
  labels: { [key: number]: string }
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

interface PollState {
  title: string
  description: string
  questions: Question[]
  is_active: boolean
  is_system_post: boolean
  expires_at?: string
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
      const response = await api.get<Poll[]>("/api/admin/polls")
      setPolls(response.data)
      for (const poll of response.data) {
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

  const isTextQuestion = (question: Question): question is TextQuestion => {
    return question.type === "text"
  }

  const isScaleQuestion = (question: Question): question is ScaleQuestion => {
    return question.type === "scale"
  }

  const isSingleChoiceQuestion = (question: Question): question is SingleChoiceQuestion => {
    return question.type === "single"
  }

  const isMultipleChoiceQuestion = (question: Question): question is MultipleChoiceQuestion => {
    return question.type === "multiple"
  }

  const isChoiceQuestion = (question: Question): question is SingleChoiceQuestion | MultipleChoiceQuestion => {
    return isSingleChoiceQuestion(question) || isMultipleChoiceQuestion(question)
  }

  const addQuestion = (type: ResponseType) => {
    switch (type) {
      case "single": {
        const newQuestion: SingleChoiceQuestion = {
          type: "single",
          question: "",
          description: "",
          options: ["", ""],
          optionDescriptions: ["", ""]
        }
        setQuestions([...questions, newQuestion])
        break
      }
      case "multiple": {
        const newQuestion: MultipleChoiceQuestion = {
          type: "multiple",
          question: "",
          description: "",
          options: ["", ""],
          optionDescriptions: ["", ""],
          maxChoices: 2
        }
        setQuestions([...questions, newQuestion])
        break
      }
      case "text": {
        const newQuestion: TextQuestion = {
          type: "text",
          question: "",
          description: "",
          maxLength: 500,
          placeholder: ""
        }
        setQuestions([...questions, newQuestion])
        break
      }
      case "scale": {
        const newQuestion: ScaleQuestion = {
          type: "scale",
          question: "",
          description: "",
          min: 1,
          max: 5,
          step: 1,
          labels: { 1: "Najniższa", 5: "Najwyższa" }
        }
        setQuestions([...questions, newQuestion])
        break
      }
      default: {
        throw new Error("Invalid question type")
      }
    }
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, updates: Partial<TextQuestion | ScaleQuestion | SingleChoiceQuestion | MultipleChoiceQuestion>) => {
    const newQuestions = [...questions]
    const currentQuestion = questions[index]

    if (isTextQuestion(currentQuestion)) {
      const textUpdates = updates as Partial<TextQuestion>
      newQuestions[index] = { ...currentQuestion, ...textUpdates }
    } else if (isScaleQuestion(currentQuestion)) {
      const scaleUpdates = updates as Partial<ScaleQuestion>
      newQuestions[index] = { ...currentQuestion, ...scaleUpdates }
    } else if (isSingleChoiceQuestion(currentQuestion)) {
      const singleChoiceUpdates = updates as Partial<SingleChoiceQuestion>
      newQuestions[index] = { ...currentQuestion, ...singleChoiceUpdates }
    } else if (isMultipleChoiceQuestion(currentQuestion)) {
      const multipleChoiceUpdates = updates as Partial<MultipleChoiceQuestion>
      newQuestions[index] = { ...currentQuestion, ...multipleChoiceUpdates }
    }

    setQuestions(newQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex]
    if (isChoiceQuestion(question)) {
      const newQuestions = [...questions]
      const choiceQuestion = newQuestions[questionIndex] as SingleChoiceQuestion | MultipleChoiceQuestion
      choiceQuestion.options[optionIndex] = value
      setQuestions(newQuestions)
    }
  }

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex]
    if (isChoiceQuestion(question)) {
      const newQuestions = [...questions]
      const choiceQuestion = newQuestions[questionIndex] as SingleChoiceQuestion | MultipleChoiceQuestion
      choiceQuestion.options.push("")
      choiceQuestion.optionDescriptions.push("")
      setQuestions(newQuestions)
    }
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex]
    if (isChoiceQuestion(question)) {
      const newQuestions = [...questions]
      const choiceQuestion = newQuestions[questionIndex] as SingleChoiceQuestion | MultipleChoiceQuestion
      choiceQuestion.options = choiceQuestion.options.filter((_, i) => i !== optionIndex)
      choiceQuestion.optionDescriptions = choiceQuestion.optionDescriptions.filter((_, i) => i !== optionIndex)
      setQuestions(newQuestions)
    }
  }

  const changeQuestionType = (index: number, newType: ResponseType): void => {
    setQuestions(questions => {
      const newQuestions = [...questions];
      const currentQuestion = questions[index];
      const questionText = currentQuestion.question;
      const description = currentQuestion.description;

      let newQuestion: Question;
      
      if (newType === 'single') {
        newQuestion = {
          type: 'single',
          question: questionText,
          description: description,
          options: 'options' in currentQuestion ? [...currentQuestion.options] : ['', ''],
          optionDescriptions: 'optionDescriptions' in currentQuestion ? [...currentQuestion.optionDescriptions] : ['', '']
        } as SingleChoiceQuestion;
      } else if (newType === 'multiple') {
        newQuestion = {
          type: 'multiple',
          question: questionText,
          description: description,
          options: 'options' in currentQuestion ? [...currentQuestion.options] : ['', ''],
          optionDescriptions: 'optionDescriptions' in currentQuestion ? [...currentQuestion.optionDescriptions] : ['', ''],
          maxChoices: 2
        } as MultipleChoiceQuestion;
      } else if (newType === 'text') {
        newQuestion = {
          type: 'text',
          question: questionText,
          description: description,
          maxLength: 500,
          placeholder: isTextQuestion(currentQuestion) ? currentQuestion.placeholder : ''
        } as TextQuestion;
      } else {
        newQuestion = {
          type: 'scale',
          question: questionText,
          description: description,
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
    const commonFields = (
      <>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 sm:mb-2">Treść pytania</label>
            <input
              type="text"
              value={question.question}
              onChange={(e) => updateQuestion(index, { question: e.target.value })}
              placeholder="Treść pytania"
              className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 sm:mb-2">Opis pytania (opcjonalnie)</label>
            <textarea
              value={question.description || ""}
              onChange={(e) => updateQuestion(index, { description: e.target.value })}
              placeholder="Opis pytania (opcjonalnie)"
              className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 sm:mb-2">Typ pytania</label>
            <select
              value={question.type}
              onChange={(e) => changeQuestionType(index, e.target.value as ResponseType)}
              className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
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

    if (isChoiceQuestion(question)) {
      return (
        <div className="space-y-4">
          {commonFields}
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1 sm:mb-2">Opcje odpowiedzi</label>
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                  placeholder={`Opcja ${optionIndex + 1}`}
                  className="flex-grow bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeOption(index, optionIndex)}
                  className="text-red-500 hover:text-red-700 transition-colors px-2 text-sm sm:text-base"
                >
                  Usuń
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOption(index)}
              className="text-[#39FF14] hover:text-[#32CC10] transition-colors text-sm sm:text-base"
            >
              + Dodaj opcję
            </button>
          </div>
          {question.type === "multiple" && (
            <div>
              <label className="block text-sm font-medium mb-1 sm:mb-2">
                Maksymalna liczba wyborów
              </label>
              <input
                type="number"
                value={question.maxChoices}
                onChange={(e) => updateQuestion(index, { maxChoices: parseInt(e.target.value) })}
                min={1}
                max={question.options.length}
                className="w-full sm:w-auto bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
          )}
        </div>
      )
    }

    if (isTextQuestion(question)) {
      return (
        <div className="space-y-4">
          {commonFields}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 sm:mb-2">
                Maksymalna długość tekstu
              </label>
              <input
                type="number"
                value={question.maxLength}
                onChange={(e) => updateQuestion(index, { maxLength: parseInt(e.target.value) })}
                min={1}
                className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 sm:mb-2">
                Placeholder
              </label>
              <input
                type="text"
                value={question.placeholder}
                onChange={(e) => updateQuestion(index, { placeholder: e.target.value })}
                className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      )
    }

    if (isScaleQuestion(question)) {
      return (
        <div className="space-y-4">
          {commonFields}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 sm:mb-2">Min</label>
              <input
                type="number"
                value={question.min}
                onChange={(e) => updateQuestion(index, { min: parseInt(e.target.value) })}
                className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 sm:mb-2">Max</label>
              <input
                type="number"
                value={question.max}
                onChange={(e) => updateQuestion(index, { max: parseInt(e.target.value) })}
                className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 sm:mb-2">Krok</label>
              <input
                type="number"
                value={question.step}
                onChange={(e) => updateQuestion(index, { step: parseInt(e.target.value) })}
                min={1}
                className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 sm:mb-2">
              Etykiety (opcjonalnie)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {Array.from({ length: (question.max - question.min) / question.step + 1 }, (_, i) => {
                const value = question.min + i * question.step
                return (
                  <div key={value} className="flex flex-col space-y-1">
                    <span className="text-xs text-gray-400">Wartość: {value}</span>
                    <input
                      type="text"
                      value={question.labels[value] || ""}
                      onChange={(e) => {
                        const newLabels = { ...question.labels }
                        if (e.target.value) {
                          newLabels[value] = e.target.value
                        } else {
                          delete newLabels[value]
                        }
                        updateQuestion(index, { labels: newLabels })
                      }}
                      placeholder={`Etykieta dla ${value}`}
                      className="w-full bg-black border border-gray-800 p-2 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    return null
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 glitch text-center">
          Zarządzanie Ankietami
        </h1>

        {/* Toast Notification - Improved positioning for different devices */}
        {showToast && (
          <div
            className={`fixed top-4 right-4 p-3 sm:p-4 rounded-lg shadow-lg transition-all duration-300 z-50 text-sm sm:text-base max-w-[90vw] sm:max-w-md ${
              toastType === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {toastMessage}
          </div>
        )}

        {/* Create Poll Button - Better spacing and sizing for mobile */}
        <div className="mb-6 sm:mb-8">
          <AnimatedButton 
            onClick={() => setShowCreator(!showCreator)} 
            className="w-full sm:w-auto text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
          >
            {showCreator ? "Ukryj kreator" : "Stwórz nową ankietę"}
          </AnimatedButton>
        </div>

        {showCreator && (
          <div className="neon-box p-4 sm:p-6 mb-6 sm:mb-8 rounded-lg">
            <h2 className="text-lg sm:text-xl md:text-2xl mb-4 sm:mb-6">Kreator ankiet</h2>
            <form onSubmit={addPoll} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1 sm:mb-2">Tytuł ankiety</label>
                  <input
                    type="text"
                    value={pollTitle}
                    onChange={(e) => setPollTitle(e.target.value)}
                    className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 sm:mb-2">Data wygaśnięcia (opcjonalnie)</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">Opis ankiety</label>
                <textarea
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                  className="w-full bg-black border border-gray-800 p-2 sm:p-3 rounded-md focus:border-[#39FF14] focus:outline-none transition-colors text-sm sm:text-base"
                  rows={3}
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSystemPost}
                    onChange={(e) => setIsSystemPost(e.target.checked)}
                    className="form-checkbox text-[#39FF14] rounded border-gray-800 focus:ring-[#39FF14]"
                  />
                  <span className="text-sm sm:text-base">Post systemowy</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="form-checkbox text-[#39FF14] rounded border-gray-800 focus:ring-[#39FF14]"
                  />
                  <span className="text-sm sm:text-base">Aktywna</span>
                </label>
              </div>

              {/* Question Editor - Improved spacing and controls for mobile */}
              <div className="space-y-4 sm:space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className="neon-box p-4 sm:p-6 rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                      <h3 className="text-base sm:text-lg mb-2 sm:mb-0">Pytanie {index + 1}</h3>
                      {index > 0 && (
                        <AnimatedButton 
                          onClick={() => removeQuestion(index)} 
                          className="w-full sm:w-auto text-sm bg-red-500"
                        >
                          Usuń pytanie
                        </AnimatedButton>
                      )}
                    </div>
                    {renderQuestionEditor(question, index)}
                  </div>
                ))}
              </div>

              {/* Question Type Buttons - Better layout for mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => addQuestion("single")}
                  className="border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                >
                  Dodaj wybór jednokrotny
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("multiple")}
                  className="border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                >
                  Dodaj wybór wielokrotny
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("text")}
                  className="border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                >
                  Dodaj pytanie otwarte
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("scale")}
                  className="border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                >
                  Dodaj skalę
                </button>
              </div>

              {/* Submit Button - Better positioning */}
              <div className="flex justify-end pt-4 sm:pt-6">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#39FF14] text-black px-6 py-3 rounded-md hover:bg-[#32CC10] transition-colors text-sm sm:text-base font-medium"
                >
                  Utwórz ankietę
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Polls Grid - Responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {polls.map((poll) => (
            <div key={poll.id} className="neon-box p-4 sm:p-6 rounded-lg">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold line-clamp-2 flex-1 mr-2">{poll.title}</h3>
                <button
                  onClick={() => deletePoll(poll.id)}
                  className="text-red-500 hover:text-red-700 transition-colors text-sm sm:text-base shrink-0"
                >
                  Usuń
                </button>
              </div>
              <p className="text-gray-300 mb-3 sm:mb-4 line-clamp-3 text-sm sm:text-base">{poll.description}</p>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                <p>Liczba pytań: {poll.questions.length}</p>
                <p>Liczba odpowiedzi: {pollResults[poll.id]?.total_votes || 0}</p>
                <p>
                  Status:{" "}
                  <span className={poll.is_active ? "text-green-500" : "text-red-500"}>
                    {poll.is_active ? "Aktywna" : "Nieaktywna"}
                  </span>
                </p>
                {poll.expires_at && (
                  <p className="truncate">
                    Wygasa: {new Date(poll.expires_at).toLocaleString("pl-PL")}
                  </p>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => togglePollStatus(poll.id, !poll.is_active)}
                  className="w-full border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm"
                >
                  {poll.is_active ? "Dezaktywuj" : "Aktywuj"}
                </button>
                <button
                  onClick={() => router.push(`/admin/polls/${poll.id}`)}
                  className="w-full border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm"
                >
                  Zobacz wyniki
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}

