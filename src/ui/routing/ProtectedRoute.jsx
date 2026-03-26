import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  const rol = user?.rol || user?.role || ''
  if (allowedRoles.length > 0 && !allowedRoles.includes(rol)) return <Navigate to="/" replace />
  return children
}

