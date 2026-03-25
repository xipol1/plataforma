import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-gray-900">
          AdFlow
        </Link>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm ${isActive ? 'text-primary-700' : 'text-gray-700'}`
                }
              >
                Dashboard
              </NavLink>
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/auth/login"
                className={({ isActive }) =>
                  `text-sm ${isActive ? 'text-primary-700' : 'text-gray-700'}`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/auth/register"
                className={({ isActive }) =>
                  `text-sm ${isActive ? 'text-primary-700' : 'text-gray-700'}`
                }
              >
                Registro
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

