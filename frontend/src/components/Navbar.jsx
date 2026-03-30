import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  founder: 'bg-amber-600',
  co_founder: 'bg-violet-600',
  admin: 'bg-rose-600',
  user: 'bg-sky-600',
};

const ROLE_LABELS = {
  founder: 'Founder',
  co_founder: 'Co-Founder',
  admin: 'Admin',
  user: 'User',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/idea', label: 'New Idea', icon: '💡' },
    { path: '/collaborate', label: 'Collaborate', icon: '🤝' },
  ];

  if (!user) return null;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <span className="font-bold text-white text-sm">Decision Intelligence</span>
              <p className="text-xs text-gray-400 leading-none">Platform</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === item.path
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${ROLE_COLORS[user.role] || 'bg-gray-600'}`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <span className="text-sm text-gray-300">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="md:hidden flex gap-1 pb-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                location.pathname === item.path
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
