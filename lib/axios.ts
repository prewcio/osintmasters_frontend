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
  withCredentials: true,
  timeout: 300000, // 5 minutes
  maxContentLength: Infinity,
  maxBodyLength: Infinity
})

// Track if we're currently refreshing the session
let isRefreshingSession = false
let failedQueue: QueueItem[] = []

// Special configuration for login endpoint
const loginConfig = {
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json",
  },
  withCredentials: true,
}

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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': typeof window !== 'undefined' ? window.location.origin : '',
        'Referer': typeof window !== 'undefined' ? window.location.origin : '',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get CSRF token')
    }

    // The CSRF token will be automatically set in the cookies by Laravel Sanctum
  } catch (error: any) {
    console.error("Failed to get CSRF token:", error)
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

      // Add common headers for all requests
      if (typeof window !== 'undefined') {
        config.headers["Origin"] = window.location.origin
        config.headers["Referer"] = window.location.origin
      }

      // Special handling for login endpoint
      if (config.url === "/api/login") {
        config.headers = {
          ...config.headers,
          ...loginConfig.headers,
        }
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

    // Handle CORS preflight error
    if (error.response?.status === 0 && error.message === 'Network Error') {
      console.error('CORS error detected')
      return Promise.reject(new Error('CORS error: Please check server configuration'))
    }

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

