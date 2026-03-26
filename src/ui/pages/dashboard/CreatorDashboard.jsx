import React, { useMemo } from 'react'
import { demoCreatorDashboard } from '../../../../services/demoData'
import { ActivityFeed, MetricTile, MiniBarList, SectionCard, StatusBadge, TableList } from './DashboardUI'

const euro = (value) => `€ ${Number(value || 0).toFixed(2)}`

const toneByStatus = {
  activo: 'success',
  pendiente: 'warning',
  completado: 'info',
  activo_moderacion: 'danger'
}

export default function CreatorDashboard() {
  const channelMix = useMemo(() => Object.entries(demoCreatorDashboard.stats.canalesPorPlataforma).map(([label, value]) => ({
    label,
    value
  })), [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
        <SectionCard title="Revenue Ledger" eyebrow="Creator Yield">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricTile
              label="Ingresos Totales"
              value={euro(demoCreatorDashboard.stats.resumen.totalIngresos)}
              hint="Facturación consolidada en el periodo visible."
              trend="+8.2%"
              accent="emerald"
            />
            <MetricTile
              label="Pendiente"
              value={euro(demoCreatorDashboard.stats.resumen.ingresosPendientes)}
              hint="Importe aún sujeto a ejecución y liquidación."
              trend="Escrow"
              accent="amber"
            />
            <MetricTile
              label="Demand"
              value={demoCreatorDashboard.stats.resumen.totalAnunciosRecibidos}
              hint="Solicitudes y campañas que ya llegaron a tu inventario."
              trend="Healthy"
              accent="blue"
            />
          </div>
        </SectionCard>

        <SectionCard title="Inventory Split" eyebrow="Portfolio Shape">
          <MiniBarList items={channelMix} labelKey="label" valueKey="value" formatter={(value) => `${value} canales`} />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <SectionCard title="Incoming Deals" eyebrow="Execution Queue">
          <TableList
            columns={[
              { key: 'title', label: 'Anuncio' },
              {
                key: 'canal',
                label: 'Canal',
                render: (row) => row.canalId?.name || '-'
              },
              {
                key: 'budget',
                label: 'Budget',
                render: (row) => <span className="font-semibold text-slate-900">{euro(row.budget)}</span>
              },
              {
                key: 'estado',
                label: 'Estado',
                render: (row) => <StatusBadge tone={toneByStatus[row.estado] || 'neutral'}>{row.estado}</StatusBadge>
              }
            ]}
            rows={demoCreatorDashboard.ads}
            emptyLabel="Todavía no hay anuncios entrantes."
          />
        </SectionCard>

        <SectionCard title="Owned Channels" eyebrow="Supply Side">
          <div className="space-y-3">
            {demoCreatorDashboard.channels.map((channel) => (
              <div key={channel._id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{channel.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{channel.platform}</p>
                  </div>
                  <StatusBadge tone="success">{channel.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent Activity" eyebrow="Signals">
        <ActivityFeed items={demoCreatorDashboard.recentActivities} />
      </SectionCard>
    </div>
  )
}
