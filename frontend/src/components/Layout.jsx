import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/expenses', label: 'Expenses', icon: '≡' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">ExpenseTrack</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            ⇥
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="mobile-header">
        <div className="mobile-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">ExpenseTrack</span>
        </div>
        <div className="mobile-user" onClick={() => setShowUserMenu(!showUserMenu)}>
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        </div>
        {showUserMenu && (
          <div className="mobile-user-menu">
            <div className="mobile-user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
            <button className="mobile-logout-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        )}
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
        <button className="mobile-nav-item mobile-nav-logout" onClick={handleLogout}>
          <span className="nav-icon">⇥</span>
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
