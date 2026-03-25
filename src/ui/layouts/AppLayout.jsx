import React from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from '../navigation/NavBar'

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

