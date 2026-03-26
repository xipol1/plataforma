import React from 'react'

export default function CreatorDashboard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Panel de creador</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        <li>Gestiona tus canales y tarifas.</li>
        <li>Revisa solicitudes de anuncios.</li>
        <li>Consulta ingresos y desempeño.</li>
      </ul>
    </div>
  )
}
