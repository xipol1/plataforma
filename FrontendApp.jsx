import React, { useState } from 'react'
import apiService from './services/api'

export default function FrontendApp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    const res = await apiService.login({ email, password })
    setResult(res)
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Login</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          required
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
        />
        <button type="submit" style={{ padding: 10, borderRadius: 8 }}>
          Entrar
        </button>
      </form>
      <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>
        {result ? JSON.stringify(result, null, 2) : ''}
      </pre>
    </div>
  )
}
