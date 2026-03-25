import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import NavBar from '../navigation/NavBar'

export default function AppLayout() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-100">
      <NavBar />
      <main className={isLanding ? 'w-full' : 'mx-auto w-full max-w-5xl px-4 py-6'}>
        <Outlet />
      </main>
    </div>
  )
}
