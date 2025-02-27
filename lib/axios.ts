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
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.osintmasters.pl",
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json",
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

// Process the failed queue
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
    await api.get("/sanctum/csrf-cookie", {
      withCredentials: true,
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    })
  } catch (error: any) {
    console.error("Failed to get CSRF token:", error)
    if (error.response?.status === 500 && 
        error.response?.data?.message?.includes("no such table: sessions")) {
      return
    }
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

      // Add origin header
      config.headers["Origin"] = window.location.origin

      // Special handling for login endpoint
      if (config.url === "/api/login") {
        config.headers["Access-Control-Allow-Origin"] = "*"
        config.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
        config.headers["Access-Control-Allow-Headers"] = "Content-Type, X-XSRF-TOKEN, X-Requested-With"
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
        // Attempt to get a new CSRF token
        await getCsrfToken()
        processFailedQueue()
        return api(originalRequest)
      } catch (refreshError) {
        processFailedQueue(refreshError)
        // Clear any stored tokens
        localStorage.removeItem("token")
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshingSession = false
      }
    }

    // Handle CSRF token mismatch
    if (error.response?.status === 419) {
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

