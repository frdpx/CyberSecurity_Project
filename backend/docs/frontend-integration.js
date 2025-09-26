// Frontend integration example for Supabase Auth

// 1. Install Supabase client
// npm install @supabase/supabase-js

// 2. Create Supabase client
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://skcaquhrqnfcypbvogec.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrY2FxdWhycW5mY3lwYnZvZ2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjY5NDQsImV4cCI6MjA3NDM0Mjk0NH0.hF1DkrY2ywmqNwiVLHB1NI3cyMjKaqE585tMz503Be4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 3. Authentication functions
export const authService = {
  // Sign up
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Refresh session
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return data
  }
}

// 4. API service with authentication
export const apiService = {
  async request(endpoint, options = {}) {
    const session = await authService.getSession()
    const token = session?.access_token

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    }

    const response = await fetch(`/api${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'API request failed')
    }

    return response.json()
  },

  // User profile methods
  async getProfile() {
    return this.request('/auth/profile')
  },

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  },

  // Admin methods
  async getAllProfiles(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/auth/profiles?${queryString}`)
  },

  async getLoginAttempts(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/auth/login-attempts?${queryString}`)
  },

  async getAuditLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/auth/audit-logs?${queryString}`)
  }
}

// 5. React Hook example
// Custom hook for authentication
import { useState, useEffect, useContext, createContext } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    authService.getSession().then(session => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch user profile
          try {
            const profileData = await apiService.getProfile()
            setProfile(profileData.data)
          } catch (error) {
            console.error('Failed to fetch profile:', error)
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    profile,
    loading,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut,
    refreshSession: authService.refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 6. Example component usage
export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await signIn(email, password)
      // Redirect or show success message
    } catch (error) {
      console.error('Login failed:', error)
      // Show error message
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}

// 7. Protected Route component
export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in to access this page.</div>
  }

  if (requiredRole && (!profile || profile.role !== requiredRole)) {
    return <div>You don't have permission to access this page.</div>
  }

  return children
}