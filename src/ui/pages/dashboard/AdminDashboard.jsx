import React, { useMemo } from 'react'
import { demoChannels } from '../../../../services/demoData'
import { ActivityFeed, MetricTile, MiniBarList, SectionCard, StatusBadge, TableList } from './DashboardUI'

const euro = (value) => `€ ${Number(value || 0).toFixed(2)}`

export default function AdminDashboard({ campaigns = [], transactions = [], resumen, loading }) {
  const inventoryByPlatform = useMemo(() => {
    const counts = demoChannels.reduce((acc, channel) => {
      const key = channel.plataforma
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts).map(([label, value]) => ({ label, value }))
  }, [])

  const moderationQueue = useMemo(() => demoChannels
    .filter((channel) => !channel.verificado)
    .slice(0, 5)
    .map((channel) => ({
      id: channel.id,
      nombre: channel.nombre,
      plataforma: channel.plataforma,
      audiencia: channel.audiencia,
      riesgo: channel.engagement > 4.5 ? 'revisión rápida' : 'revisión manual'
    })), [])

  const activityItems = useMemo(() => [
    { content: `${campaigns.length || 0} campañas visibles en esta sesión`, timestamp: 'Ahora', type: 'info' },
    { content: `${transactions.length || 0} movimientos financieros cargados`, timestamp: 'Ahora', type: 'info' },
    { content: `${moderationQueue.length} canales requieren validación humana`, timestamp: 'Hoy', type: 'moderacion' }
  ], [campaigns.length, moderationQueue.length, transactions.length])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
        <SectionCard title="Platform Operations" eyebrow="Admin Watch">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricTile
              label="GMV Visible"
              value={loading ? '...' : euro(resumen?.montoMovido || 0)}
              hint="Volumen financiero observable desde la capa actual."
              trend="Live"
              accent="emerald"
            />
            <MetricTile
              label="Campaign Load"
              value={loading ? '...' : campaigns.length}
              hint="Carga de campañas que ya impacta soporte y ejecución."
              trend={`${demoChannels.length} canales`}
              accent="blue"
            />
            <MetricTile
              label="Risk Queue"
              value={moderationQueue.length}
              hint="Elementos que necesitan decisión operativa."
              trend="Monitor"
              accent="rose"
            />
          </div>
        </SectionCard>

        <SectionCard title="Inventory Footprint" eyebrow="Marketplace Density">
          <MiniBarList items={inventoryByPlatform} labelKey="label" valueKey="value" formatter={(value) => `${value} activos`} />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <SectionCard title="Moderation Queue" eyebrow="Trust & Safety">
          <TableList
            columns={[
              { key: 'nombre', label: 'Canal' },
              { key: 'plataforma', label: 'Plataforma' },
              { key: 'audiencia', label: 'Audiencia' },
              {
                key: 'riesgo',
                label: 'Tratamiento',
                render: (row) => <StatusBadge tone={row.riesgo === 'revisión manual' ? 'warning' : 'info'}>{row.riesgo}</StatusBadge>
              }
            ]}
            rows={moderationQueue}
            emptyLabel="No hay elementos pendientes de moderación."
          />
        </SectionCard>

        <SectionCard title="Ops Feed" eyebrow="System Signals">
          <ActivityFeed items={activityItems} />
        </SectionCard>
      </div>
    </div>
  )
}
