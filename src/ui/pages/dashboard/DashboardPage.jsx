import React from 'react'
import { useAuth } from '../../../auth/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft">
      <h1 className="mb-2 text-xl font-semibold text-gray-900">Dashboard</h1>
      <div className="text-sm text-gray-700">
        <div>
          <span className="text-gray-500">Email:</span> {user?.email || '-'}
        </div>
        <div>
          <span className="text-gray-500">Rol:</span> {user?.role || '-'}
        </div>
      </div>
    </div>
  )
}

