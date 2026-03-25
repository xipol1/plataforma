import React from 'react'
import { useAuth } from '../../../auth/AuthContext'
import AdminDashboard from './AdminDashboard'
import AdvertiserDashboard from './AdvertiserDashboard'
import CreatorDashboard from './CreatorDashboard'

const dashboardByRole = {
  admin: AdminDashboard,
  advertiser: AdvertiserDashboard,
  anunciante: AdvertiserDashboard,
  creator: CreatorDashboard,
  creador: CreatorDashboard
}

export default function DashboardPage() {
  const { user } = useAuth()
  const role = user?.role || user?.rol || 'advertiser'
  const RoleDashboard = dashboardByRole[role] || AdvertiserDashboard

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-700">
          <div>
            <span className="text-gray-500">Email:</span> {user?.email || '-'}
          </div>
          <div>
            <span className="text-gray-500">Rol:</span> {role}
          </div>
        </div>
      </div>
      <RoleDashboard />
    </div>
  )
}
