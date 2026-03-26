import React from 'react'

export default function AdminDashboard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Panel de administrador</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        <li>Revisión de usuarios y roles.</li>
        <li>Moderación de campañas y canales.</li>
        <li>Monitoreo global de actividad.</li>
      </ul>
    </div>
  )
}
