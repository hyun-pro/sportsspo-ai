import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const loginUser = (token, userData) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const isPremium = user?.subscription_status === 'active' || user?.plan === 'pro' || user?.plan === 'premium' || user?.is_admin
  const planLabel = user?.plan === 'premium' ? 'PREMIUM' : user?.plan === 'pro' ? 'PRO' : user?.is_admin ? 'ADMIN' : null

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, isPremium, planLabel }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
