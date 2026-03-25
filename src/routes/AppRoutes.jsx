import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../ui/layouts/AppLayout'
import ProtectedRoute from '../ui/routing/ProtectedRoute'
import LoginPage from '../ui/pages/auth/LoginPage'
import RegisterPage from '../ui/pages/auth/RegisterPage'
import DashboardPage from '../ui/pages/dashboard/DashboardPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/auth" element={<AppLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

