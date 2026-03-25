import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../ui/routing/ProtectedRoute'
import DashboardPage from '../ui/pages/dashboard/DashboardPage'
import { useAuth } from '../auth/AuthContext'
import AuthPage from '../legacy/AuthPage'
import LandingPage from '../legacy/LandingPage'
import AdminDashboard from '../legacy/AdminDashboard'
import AdvertiserDashboard from '../legacy/AdvertiserDashboard'
import CreatorDashboard from '../legacy/CreatorDashboard'

export default function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/auth/login" element={<Navigate to="/auth" replace />} />
      <Route path="/auth/register" element={<Navigate to="/auth" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/*"
        element={
          <ProtectedRoute allowedRoles={['creador']}>
            <CreatorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/advertiser/*"
        element={
          <ProtectedRoute allowedRoles={['anunciante']}>
            <AdvertiserDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

