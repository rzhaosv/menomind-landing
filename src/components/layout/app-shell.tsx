'use client';

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { Avatar } from '../ui/avatar';
import { NavLink, MobileTabLink, navItems, mobileTabItems } from './nav';

/* ------------------------------------------------------------------ */
/*  Inline icons for header                                            */
/* ------------------------------------------------------------------ */

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  User dropdown                                                      */
/* ------------------------------------------------------------------ */

interface UserDropdownProps {
  userName?: string;
  userAvatar?: string;
}

function UserDropdown({ userName = 'User', userAvatar }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <Avatar name={userName} src={userAvatar} size="sm" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          role="menu"
          aria-label="User menu options"
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-brand-dark truncate">{userName}</p>
          </div>
          <a
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            Profile
          </a>
          <a
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            Settings
          </a>
          <hr className="my-1 border-gray-100" />
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            role="menuitem"
            onClick={() => {
              // Sign out logic is handled by the consuming app
              window.location.href = '/auth/signout';
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AppShell                                                           */
/* ------------------------------------------------------------------ */

export interface AppShellUser {
  id: string;
  email: string;
  name: string;
  tier: string;
  onboardingCompleted: boolean;
}

export interface AppShellProps {
  children: ReactNode;
  /** Pass a user object (from layout) or individual userName/userAvatar strings. */
  user?: AppShellUser;
  userName?: string;
  userAvatar?: string;
}

function AppShell({ children, user, userName, userAvatar }: AppShellProps) {
  const resolvedName = user?.name || userName;
  const resolvedAvatar = userAvatar;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* -------- Mobile sidebar overlay -------- */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* -------- Sidebar -------- */}
      <aside
        className={[
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
          <a href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-brand-purple">MenoMind</span>
          </a>
          <button
            type="button"
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          MenoMind &copy; {new Date().getFullYear()}
        </div>
      </aside>

      {/* -------- Main area -------- */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <MenuIcon />
            </button>
            <span className="text-lg font-bold text-brand-purple lg:hidden">
              MenoMind
            </span>
          </div>

          <UserDropdown userName={resolvedName} userAvatar={resolvedAvatar} />
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* -------- Mobile bottom tabs -------- */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {mobileTabItems.map((item) => (
            <MobileTabLink key={item.href} item={item} />
          ))}
        </div>
      </nav>
    </div>
  );
}

export { AppShell };
