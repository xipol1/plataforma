import React, { useEffect, useMemo, useState } from 'react'
import { Bolt, CreditCard, LayoutPanelTop, Radar } from 'lucide-react'
import { useAuth } from '../../../auth/AuthContext'
import apiService from '../../../../services/api'
import AdminDashboard from './AdminDashboard'
import AdvertiserDashboard from './AdvertiserDashboard'
import CreatorDashboard from './CreatorDashboard'
import { DashboardHero, HeroPanel, MetricTile } from './DashboardUI'

const dashboardByRole = {
  admin: AdminDashboard,
  advertiser: AdvertiserDashboard,
  creator: CreatorDashboard,
  anunciante: AdvertiserDashboard,
  creador: CreatorDashboard,
}

const roleCopy = {
  admin: {
    eyebrow: 'Platform Command',
    title: 'Control room con señal operativa real.',
    subtitle: 'Visión de actividad, riesgo y throughput de toda la plataforma. Pensado para detectar desviaciones antes de que rompan ingresos o experiencia.',
    accent: 'from-[#0f172a] via-[#13253f] to-[#0f766e]'
  },
  advertiser: {
    eyebrow: 'Revenue Engine',
    title: 'Un cockpit de campañas para decidir y mover presupuesto con criterio.',
    subtitle: 'Rendimiento, capital desplegado y pipeline de ejecución en una sola capa, con lectura rápida y priorización visual clara.',
    accent: 'from-[#0f172a] via-[#1d4ed8] to-[#0891b2]'
  },
  creator: {
    eyebrow: 'Creator Ledger',
    title: 'Visibilidad sobre ingresos, inventario y demanda sin ruido.',
    subtitle: 'Un tablero orientado a monetización: cuánto entra, qué canales traccionan y qué acciones desbloquean más facturación.',
    accent: 'from-[#111827] via-[#14532d] to-[#0f766e]'
  },
  anunciante: {
    eyebrow: 'Revenue Engine',
    title: 'Un cockpit de campañas para decidir y mover presupuesto con criterio.',
    subtitle: 'Rendimiento, capital desplegado y pipeline de ejecución en una sola capa, con lectura rápida y priorización visual clara.',
    accent: 'from-[#0f172a] via-[#1d4ed8] to-[#0891b2]'
  },
  creador: {
    eyebrow: 'Creator Ledger',
    title: 'Visibilidad sobre ingresos, inventario y demanda sin ruido.',
    subtitle: 'Un tablero orientado a monetización: cuánto entra, qué canales traccionan y qué acciones desbloquean más facturación.',
    accent: 'from-[#111827] via-[#14532d] to-[#0f766e]'
  }
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
        setError(campaignRes?.message || 'No se pudieron cargar campañas')
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
    const paidCampaigns = campaigns.filter((item) => String(item.estado || '').toLowerCase() === 'paid').length
    const publishedCampaigns = campaigns.filter((item) => ['published', 'completed'].includes(String(item.estado || '').toLowerCase())).length

    return {
      campaigns: campaigns.length,
      presupuesto: totalPresupuesto,
      transacciones: transactions.length,
      montoMovido: totalTransacciones,
      paidCampaigns,
      publishedCampaigns
    }
  }, [campaigns, transactions])

  const copy = roleCopy[role] || roleCopy.advertiser

  return (
    <div className="space-y-6">
      <DashboardHero eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} accent={copy.accent}>
        <div className="grid gap-3 sm:grid-cols-2">
          <HeroPanel label="Cuenta" value={user?.email || '-'} detail={`Rol activo: ${role}`} />
          <HeroPanel
            label="Live Throughput"
            value={loading ? '...' : `${resumen.campaigns}/${resumen.transacciones}`}
            detail="Campañas y movimientos ya visibles en el workspace"
            tone="sky"
          />
        </div>
      </DashboardHero>

      {loading && (
        <div className="rounded-[24px] border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-800">
          Cargando la capa operativa del dashboard...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Campaigns"
          value={loading ? '...' : resumen.campaigns}
          hint="Volumen operativo total del workspace."
          trend={loading ? null : `${resumen.publishedCampaigns} activadas`}
          accent="blue"
        />
        <MetricTile
          label="Budget Under Mgmt"
          value={loading ? '...' : `€ ${resumen.presupuesto.toFixed(2)}`}
          hint="Capital comprometido en campañas y ejecuciones."
          trend={loading ? null : `${resumen.paidCampaigns} pagadas`}
          accent="emerald"
        />
        <MetricTile
          label="Transactions"
          value={loading ? '...' : resumen.transacciones}
          hint="Eventos financieros visibles desde la API actual."
          trend={loading ? null : `€ ${resumen.montoMovido.toFixed(2)}`}
          accent="amber"
        />
        <MetricTile
          label="System Readiness"
          value={loading ? '...' : `${Math.min(100, 42 + resumen.campaigns * 7)}%`}
          hint="Indicador sintético de tracción y madurez operativa."
          trend="Live"
          accent="rose"
        />
      </div>

      {!loading && !error && campaigns.length === 0 && transactions.length === 0 && (
        <div className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:grid-cols-3">
          <QuickStart icon={LayoutPanelTop} title="Activa el pipeline" text="Crea tu primera campaña para empezar a poblar métricas reales." />
          <QuickStart icon={CreditCard} title="Trae señal financiera" text="Registra una transacción para medir cashflow y volumen." />
          <QuickStart icon={Radar} title="Construye visibilidad" text="El dashboard gana densidad cuando entran campañas, cobros y estados." />
        </div>
      )}

      <RoleDashboard campaigns={campaigns} transactions={transactions} resumen={resumen} loading={loading} />
    </div>
  )
}

function QuickStart({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
      <div className="inline-flex rounded-2xl bg-slate-900 p-3 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
        <Bolt className="h-3.5 w-3.5" />
        Next move
      </div>
    </div>
  )
}
