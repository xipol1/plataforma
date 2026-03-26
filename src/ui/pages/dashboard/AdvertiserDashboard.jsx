import React, { useMemo } from 'react'
import { demoAdvertiserDashboard, demoChannels } from '../../../../services/demoData'
import { ActivityFeed, MetricTile, MiniBarList, SectionCard, StatusBadge, TableList } from './DashboardUI'

const euro = (value) => `€ ${Number(value || 0).toFixed(2)}`
const integer = (value) => Intl.NumberFormat('es-ES').format(Number(value || 0))

const toneByStatus = {
  activo: 'success',
  pending: 'warning',
  pendiente: 'warning',
  draft: 'neutral',
  completed: 'info',
  completado: 'info'
}

export default function AdvertiserDashboard({ campaigns = [], resumen, loading }) {
  const liveRows = useMemo(() => {
    if (campaigns.length) {
      return campaigns.slice(0, 5).map((campaign) => ({
        id: campaign.id,
        title: campaign.titulo || 'Campaña sin título',
        state: String(campaign.estado || 'draft').toLowerCase(),
        budget: campaign.presupuesto,
        channel: campaign.channel || '-'
      }))
    }

    return demoAdvertiserDashboard.activeAds.map((ad) => ({
      id: ad._id,
      title: ad.title,
      state: ad.estado,
      budget: ad.budget,
      channel: ad.canalId?.name || '-'
    }))
  }, [campaigns])

  const bestChannels = useMemo(() => demoChannels
    .filter((channel) => channel.verificado)
    .sort((a, b) => ((b.ctr || 0) * (b.engagement || 0)) - ((a.ctr || 0) * (a.engagement || 0)))
    .slice(0, 4)
    .map((channel) => ({
      label: channel.nombre,
      score: Number(((channel.ctr || 0) * (channel.engagement || 0)).toFixed(1))
    })), [])

  const statusMix = useMemo(() => Object.entries(demoAdvertiserDashboard.stats.anunciosPorEstado).map(([label, value]) => ({
    label,
    value
  })), [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <SectionCard title="Campaign Engine" eyebrow="Advertiser Overview" action={loading ? 'Syncing' : 'Live'}>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricTile
              label="CTR Blend"
              value={`${demoAdvertiserDashboard.stats.resumen.ctr.toFixed(1)}%`}
              hint="Media operativa del portfolio activo."
              trend="Strong"
              accent="blue"
            />
            <MetricTile
              label="Impressions"
              value={integer(demoAdvertiserDashboard.stats.resumen.impresionesTotales)}
              hint="Huella total entregada por el mix actual."
              trend="+12.4%"
              accent="emerald"
            />
            <MetricTile
              label="Spend Pace"
              value={euro(resumen?.montoMovido || demoAdvertiserDashboard.stats.resumen.totalInversion)}
              hint="Capital ya convertido en actividad medible."
              trend="On plan"
              accent="amber"
            />
          </div>
        </SectionCard>

        <SectionCard title="State Mix" eyebrow="Execution Pulse">
          <MiniBarList items={statusMix} labelKey="label" valueKey="value" formatter={(value) => `${value} campañas`} />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <SectionCard title="Active Campaigns" eyebrow="Priority Queue">
          <TableList
            columns={[
              { key: 'title', label: 'Campaña' },
              { key: 'channel', label: 'Canal' },
              {
                key: 'budget',
                label: 'Budget',
                render: (row) => <span className="font-semibold text-slate-900">{euro(row.budget)}</span>
              },
              {
                key: 'state',
                label: 'Estado',
                render: (row) => <StatusBadge tone={toneByStatus[row.state] || 'neutral'}>{row.state}</StatusBadge>
              }
            ]}
            rows={liveRows}
            emptyLabel="Todavía no hay campañas activas para mostrar."
          />
        </SectionCard>

        <SectionCard title="Best Channels" eyebrow="Suggested Allocation">
          <MiniBarList items={bestChannels} labelKey="label" valueKey="score" formatter={(value) => `${value} score`} />
        </SectionCard>
      </div>

      <SectionCard title="Recent Activity" eyebrow="What Changed">
        <ActivityFeed items={demoAdvertiserDashboard.recentActivities} />
      </SectionCard>
    </div>
  )
}
