import React from 'react'

export default function AdvertiserDashboard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Panel de anunciante</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        <li>Crear y administrar campañas.</li>
        <li>Seleccionar canales por segmento.</li>
        <li>Analizar conversiones y rendimiento.</li>
      </ul>
    </div>
  )
}
