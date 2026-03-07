'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  SVG icons (inline, no library needed)                              */
/* ------------------------------------------------------------------ */

export const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

export const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

export const GearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  { label: 'AI Chat', href: '/chat', icon: <MessageIcon /> },
  { label: 'Track Symptoms', href: '/track', icon: <ChartIcon /> },
  { label: 'Wellness Plans', href: '/plans', icon: <ClipboardIcon /> },
  { label: 'Settings', href: '/settings', icon: <GearIcon /> },
];

/** Mobile bottom-tab items (subset without Settings) */
export const mobileTabItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  { label: 'Chat', href: '/chat', icon: <MessageIcon /> },
  { label: 'Track', href: '/track', icon: <ChartIcon /> },
  { label: 'Plans', href: '/plans', icon: <ClipboardIcon /> },
];

/* ------------------------------------------------------------------ */
/*  Sidebar nav link                                                   */
/* ------------------------------------------------------------------ */

export interface NavLinkProps {
  item: NavItem;
  collapsed?: boolean;
  onClick?: () => void;
}

export function NavLink({ item, collapsed = false, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
        isActive
          ? 'bg-brand-purple/10 text-brand-purple'
          : 'text-gray-600 hover:bg-gray-100 hover:text-brand-dark',
        collapsed ? 'justify-center' : '',
      ].join(' ')}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile bottom tab link                                             */
/* ------------------------------------------------------------------ */

export function MobileTabLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition-colors',
        isActive ? 'text-brand-purple' : 'text-gray-400 hover:text-gray-600',
      ].join(' ')}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}
