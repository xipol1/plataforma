import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../ui/routing/ProtectedRoute'
import AppLayout from '../ui/layouts/AppLayout'
import LoginPage from '../ui/pages/auth/LoginPage'
import RegisterPage from '../ui/pages/auth/RegisterPage'
import LandingPage from '../ui/pages/landing/LandingPage'
import DashboardPage from '../ui/pages/dashboard/DashboardPage'
import { useAuth } from '../auth/AuthContext'

export default function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route
          path="auth"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth/login" replace />}
        />
        <Route
          path="auth/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="auth/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />

        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
