'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { NavBar } from '@/components/NavBar';
import { Home, FolderOpen, Rss, Settings } from 'lucide-react';

const navItems = [
    { name: 'Feed', url: '/', icon: Home },
    { name: 'Quellen', url: '/sources', icon: Rss },
    { name: 'Kategorien', url: '/categories', icon: FolderOpen },
    { name: 'Einstellungen', url: '/settings', icon: Settings },
];

export function NavBarWrapper() {
    const pathname = usePathname();
    const { user, loading } = useAuth();

    // Hide navbar on auth pages or when not logged in
    const hideOn = ['/login', '/register', '/forgot-password'];
    if (hideOn.includes(pathname)) return null;
    if (!loading && !user) return null;

    return <NavBar items={navItems} />;
}
