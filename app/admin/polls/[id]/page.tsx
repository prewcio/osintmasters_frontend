"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PageTransition from "@/components/page-transition"
import AnimatedButton from "@/components/animated-button"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/axios"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

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
  active: boolean
  created_at: string
  expires_at?: string
  is_system_post?: boolean
}

interface PollResults {
  id: number
  results: QuestionResult[]
  total_votes: number
}

export default function PollStatistics({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [results, setResults] = useState<PollResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchPollAndResults = async () => {
      try {
        setLoading(true)
        const [pollResponse, resultsResponse] = await Promise.all([
          api.get<Poll>(`/api/admin/polls/${params.id}`),
          api.get<PollResults>(`/api/admin/polls/results/${params.id}`)
        ])
        setPoll(pollResponse.data)
        setResults(resultsResponse.data)
      } catch (err) {
        console.error("Failed to fetch poll data:", err)
        setError("Nie udało się załadować danych ankiety. Spróbuj ponownie później.")
      } finally {
        setLoading(false)
      }
    }

    fetchPollAndResults()
  }, [params.id])

  if (!user || (user.role !== "admin" && !user.is_admin)) {
    router.push("/dashboard")
    return null
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="text-center">Ładowanie...</div>
      </PageTransition>
    )
  }

  if (error || !poll || !results) {
    return (
      <PageTransition>
        <div className="text-red-500 text-center">{error || "Nie znaleziono ankiety"}</div>
      </PageTransition>
    )
  }

  const renderQuestionResults = (question: Question, result: QuestionResult, index: number) => {
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: 'white'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: 'white'
          }
        },
        x: {
          ticks: {
            color: 'white'
          }
        }
      }
    }

    switch (question.type) {
      case "single":
      case "multiple": {
        if (result.type !== question.type) return null
        const data = {
          labels: question.options,
          datasets: [{
            data: Object.values(result.results),
            backgroundColor: [
              'rgba(57, 255, 20, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
            ],
            borderColor: [
              'rgba(57, 255, 20, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1
          }]
        }

        return (
          <div className="space-y-6">
            <div className="h-[300px]">
              <Pie data={data} options={chartOptions} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {question.options.map((option, idx) => (
                <div key={idx} className="flex justify-between items-start p-4 border border-gray-800">
                  <div>
                    <p>{option}</p>
                    {question.optionDescriptions?.[idx] && (
                      <p className="text-sm text-gray-400">{question.optionDescriptions[idx]}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[#39FF14]">{result.results[idx] || 0}</p>
                    <p className="text-sm text-gray-400">
                      {((result.results[idx] || 0) / results.total_votes * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "text": {
        if (result.type !== "text") return null
        return (
          <div className="space-y-4">
            <p className="text-gray-400">Liczba odpowiedzi: {result.responses.length}</p>
            <div className="space-y-4">
              {result.responses.map((response, idx) => (
                <div key={idx} className="p-4 border border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Odpowiedź #{idx + 1}</p>
                  <p className="whitespace-pre-wrap">{response}</p>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case "scale": {
        if (result.type !== "scale") return null
        const data = {
          labels: Object.keys(result.distribution).map(value => 
            question.labels?.[parseInt(value)] || value
          ),
          datasets: [{
            label: 'Liczba odpowiedzi',
            data: Object.values(result.distribution),
            backgroundColor: 'rgba(57, 255, 20, 0.5)',
            borderColor: 'rgba(57, 255, 20, 1)',
            borderWidth: 1
          }]
        }

        return (
          <div className="space-y-6">
            <div className="h-[300px]">
              <Bar data={data} options={chartOptions} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg">
                Średnia: <span className="text-[#39FF14]">{result.average.toFixed(2)}</span>
              </p>
              <p className="text-gray-400">
                Zakres: {question.min} - {question.max} (krok: {question.step})
              </p>
              {question.labels && Object.entries(question.labels).length > 0 && (
                <div className="text-sm text-gray-400">
                  Etykiety:
                  {Object.entries(question.labels).map(([value, label]) => (
                    <span key={value} className="ml-2">
                      {value}: {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      }
    }
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold glitch">Statystyki Ankiety</h1>
          <AnimatedButton onClick={() => router.push("/admin/polls")}>
            Powrót
          </AnimatedButton>
        </div>

        <div className="neon-box p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">{poll.title}</h2>
          <p className="text-gray-300 mb-4">{poll.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <p>Utworzono: {new Date(poll.created_at).toLocaleString("pl-PL")}</p>
            {poll.expires_at && (
              <p>Wygasa: {new Date(poll.expires_at).toLocaleString("pl-PL")}</p>
            )}
            <p>Status: {poll.active ? "Aktywna" : "Nieaktywna"}</p>
            <p>Liczba odpowiedzi: {results.total_votes}</p>
          </div>
        </div>

        <div className="space-y-8">
          {poll.questions.map((question, index) => (
            <div key={index} className="neon-box p-6">
              <h3 className="text-xl font-semibold mb-4">
                Pytanie {index + 1}: {question.question}
              </h3>
              {question.description && (
                <p className="text-gray-400 mb-4">{question.description}</p>
              )}
              {renderQuestionResults(question, results.results[index], index)}
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
} 