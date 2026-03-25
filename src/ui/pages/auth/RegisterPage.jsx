import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../../../services/api'
import { useAuth } from '../../../auth/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await apiService.register({ email, password })
    if (!res?.success) {
      setLoading(false)
      setError(res?.message || 'No se pudo crear la cuenta')
      return
    }
    const loginRes = await login({ email, password })
    setLoading(false)
    if (loginRes?.success) {
      navigate('/dashboard')
      return
    }
    navigate('/auth/login')
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-soft">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Crear cuenta</h1>
      <p className="mb-6 text-sm text-gray-600">Regístrate para acceder al dashboard</p>
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Email</span>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Contraseña</span>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}

