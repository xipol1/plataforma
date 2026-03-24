import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from '../components/NotificationCenter';
import { useAuth } from '../hooks/useAuth';

const DashboardLayout = ({ children, user, sidebarItems, activeItem, onItemChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const displayName = user?.nombre || user?.name || 'Usuario';
  const displayEmail = user?.email || 'email@ejemplo.com';
  const avatarLetter = (displayName || 'U').charAt(0);

  const { primaryItems, secondaryItems } = useMemo(() => {
    const items = Array.isArray(sidebarItems) ? sidebarItems : [];
    return {
      primaryItems: items.filter((i) => i?.id !== 'settings'),
      secondaryItems: items.filter((i) => i?.id === 'settings'),
    };
  }, [sidebarItems]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const Sidebar = ({ onNavigateItem }) => (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 px-6 flex items-center bg-primary-600">
        <h1 className="text-lg font-semibold text-white">ADFLOW</h1>
      </div>

      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold">{avatarLetter}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <nav className="p-6 overflow-y-auto">
          <ul className="flex flex-col">
            {primaryItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigateItem?.(item.id)}
                  className={`w-full flex items-center gap-4 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeItem === item.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-gray-200 flex flex-col">
          {secondaryItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigateItem?.(item.id)}
              className={`w-full flex items-center gap-4 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeItem === item.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              type="button"
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          <button
            className="w-full flex items-center gap-4 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
            onClick={handleLogout}
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="h-screen bg-gray-50 flex">
      <div className="hidden lg:flex">
        <Sidebar onNavigateItem={onItemChange} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0">
            <Sidebar
              onNavigateItem={(id) => {
                onItemChange?.(id);
                setSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-4">
              <NotificationCenter />
              <button className="flex items-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100" type="button">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">{avatarLetter}</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
