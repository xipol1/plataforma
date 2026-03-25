import React from 'react'
import { useAuth } from '../../../auth/AuthContext'
import AdminDashboard from '../../../legacy/AdminDashboard'
import AdvertiserDashboard from '../../../legacy/AdvertiserDashboard'
import CreatorDashboard from '../../../legacy/CreatorDashboard'

export default function DashboardPage() {
  const { user } = useAuth()
  const rol = user?.rol || user?.role || ''

  if (rol === 'admin') return <AdminDashboard />
  if (rol === 'anunciante') return <AdvertiserDashboard />
  if (rol === 'creador') return <CreatorDashboard />

  return <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft">Rol no soportado</div>
}

