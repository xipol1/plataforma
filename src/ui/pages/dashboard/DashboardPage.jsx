import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import apiService from '../../../../services/api'
import AdminDashboard from './AdminDashboard'
import AdvertiserDashboard from './AdvertiserDashboard'
import CreatorDashboard from './CreatorDashboard'

const dashboardByRole = {
  admin: AdminDashboard,
  advertiser: AdvertiserDashboard,
  creator: CreatorDashboard
}

export default function DashboardPage() {
  const { user } = useAuth()
  const role = user?.role || user?.rol || 'advertiser'
  const RoleDashboard = dashboardByRole[role] || AdvertiserDashboard

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [campaigns, setCampaigns] = useState([])
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    let alive = true

    const loadData = async () => {
      setLoading(true)
      setError('')

      const [campaignRes, txRes] = await Promise.all([
        apiService.getMyCampaigns(),
        apiService.getMyTransactions()
      ])

      if (!alive) return

      if (!campaignRes?.success) {
        setError(campaignRes?.message || 'No se pudieron cargar campaÃ±as')
      } else {
        setCampaigns(Array.isArray(campaignRes.data) ? campaignRes.data : [])
      }

      if (!txRes?.success) {
        setError((prev) => prev || txRes?.message || 'No se pudieron cargar transacciones')
      } else {
        setTransactions(Array.isArray(txRes.data) ? txRes.data : [])
      }

      setLoading(false)
    }

    loadData()

    return () => {
      alive = false
    }
  }, [])

  const resumen = useMemo(() => {
    const totalPresupuesto = campaigns.reduce((sum, item) => sum + (Number(item.presupuesto) || 0), 0)
    const totalTransacciones = transactions.reduce((sum, item) => sum + (Number(item.monto) || 0), 0)

    return {
      campaigns: campaigns.length,
      presupuesto: totalPresupuesto,
      transacciones: transactions.length,
      montoMovido: totalTransacciones
    }
  }, [campaigns, transactions])

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

      {loading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          Cargando datos reales del dashboard...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card label="CampaÃ±as" value={resumen.campaigns} />
          <Card label="Presupuesto" value={`â‚¬ ${resumen.presupuesto.toFixed(2)}`} />
          <Card label="Transacciones" value={resumen.transacciones} />
          <Card label="Monto movido" value={`â‚¬ ${resumen.montoMovido.toFixed(2)}`} />
        </div>
      )}

      {!loading && !error && campaigns.length === 0 && transactions.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          AÃºn no tienes campaÃ±as ni transacciones. Crea tu primera campaÃ±a para comenzar.
        </div>
      )}

      <RoleDashboard />
    </div>
  )
}

function Card({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-soft">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}
