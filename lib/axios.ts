import axios from "axios"

// Global error handler for client-side exceptions
if (typeof window !== 'undefined') {
  window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Client-side error:', { msg, url, lineNo, columnNo, error })
    return false
  }

  window.onunhandledrejection = function(event) {
    console.error('Unhandled promise rejection:', event.reason)
  }
}

// Define types for the queue
type QueueItem = {
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.49:8000",
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json"
  },
  withCredentials: true
})

// Track if we're currently refreshing the session
let isRefreshingSession = false
let failedQueue: QueueItem[] = []

// Check if user is logged in and redirect if necessary
const checkAuthAndRedirect = async () => {
  if (typeof window === 'undefined') return

  const publicPaths = ['/', '/login']
  const currentPath = window.location.pathname

  if (publicPaths.includes(currentPath)) {
    try {
      const response = await api.get("/api/user")
      if (response.data) {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      // User is not logged in, which is expected on public paths
      console.log("User not authenticated")
    }
  }
}

// Call the check on initial load
if (typeof window !== 'undefined') {
  checkAuthAndRedirect()
}

const processFailedQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(undefined)
    }
  })
  failedQueue = []
}

// Get CSRF cookie before making any requests
const getCsrfToken = async () => {
  try {
    await api.get("/sanctum/csrf-cookie")
  } catch (error: any) {
    console.error("Failed to get CSRF token:", error)
    // Check for the specific error case
    if (error.response?.status === 500 && 
        error.response?.data?.message?.includes("no such table: sessions")) {
      return
    }
    throw error
  }
}

// Attempt to restore the session
const restoreSession = async () => {
  try {
    await getCsrfToken()
    const response = await api.get("/api/user")
    if (response.data) {
      // If we successfully restored the session and we're on a public path, redirect to dashboard
      if (typeof window !== 'undefined' && ['/', '/login'].includes(window.location.pathname)) {
        return null
      }
    }
    return response.data
  } catch (error) {
    console.error("Failed to restore session:", error)
    throw error
  }
}

// Request interceptor to get CSRF token and handle errors
api.interceptors.request.use(
  async (config) => {
    try {
      // Get CSRF token for all non-GET requests
      if (!["get", "head", "options"].includes(config.method?.toLowerCase() || "")) {
        await getCsrfToken()
      }

      // Get the XSRF-TOKEN from cookies
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1]

      if (token) {
        // Laravel expects the token in X-XSRF-TOKEN header
        config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token)
      }

      return config
    } catch (error) {
      console.error("Request interceptor error:", error)
      return Promise.reject(error)
    }
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If we get a 401 and we haven't tried to refresh the session yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshingSession) {
        // If we're already refreshing the session, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshingSession = true

      try {
        // Attempt to restore the session
        await restoreSession()
        processFailedQueue()
        return api(originalRequest)
      } catch (refreshError) {
        processFailedQueue(refreshError)
        // Only redirect to login if we're not already on the login page
        if (window.location.pathname !== '/login') {
          return Promise.reject(refreshError)
        }
      } finally {
        isRefreshingSession = false
      }
    } else if (error.response?.status === 419) {
      // CSRF token mismatch - try to get a new token and retry the request
      console.log("CSRF token mismatch - retrying with new token")
      try {
        await getCsrfToken()
        return api(originalRequest)
      } catch (csrfError) {
        console.error("Failed to refresh CSRF token:", csrfError)
        return Promise.reject(csrfError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

