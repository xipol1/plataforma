import React, { createContext, useContext, useMemo, useState } from 'react'
import apiService from '../../services/api'

const AuthContext = createContext(null)

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || '')
  const [user, setUser] = useState(() => readJson('user', null))

  const isAuthenticated = Boolean(token)

  const login = async ({ email, password }) => {
    const res = await apiService.login({ email, password })
    if (res && res.success && res.token && res.user) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('refreshToken', res.refreshToken || '')
      localStorage.setItem('user', JSON.stringify(res.user))
      setToken(res.token)
      setRefreshToken(res.refreshToken || '')
      setUser(res.user)
    }
    return res
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setToken('')
    setRefreshToken('')
    setUser(null)
  }

  const value = useMemo(() => {
    return { token, refreshToken, user, isAuthenticated, login, logout }
  }, [token, refreshToken, user, isAuthenticated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

