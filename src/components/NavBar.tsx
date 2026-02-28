'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface NavItem {
    name: string;
    url: string;
    icon: LucideIcon;
}

interface NavBarProps {
    items: NavItem[];
}

export function NavBar({ items }: NavBarProps) {
    const pathname = usePathname();

    const activeIndex = useMemo(() => {
        const idx = items.findIndex(item => {
            if (item.url === '/') return pathname === '/';
            return pathname.startsWith(item.url);
        });
        return idx >= 0 ? idx : 0;
    }, [pathname, items]);

    return (
        <div className="navbar-wrapper">
            <nav className="navbar">
                {items.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeIndex === index;

                    return (
                        <Link
                            key={item.name}
                            href={item.url}
                            className={`navbar__item ${isActive ? 'navbar__item--active' : ''}`}
                        >
                            <Icon size={20} strokeWidth={2.5} />
                            <span className="navbar__label">{item.name}</span>

                            {isActive && (
                                <motion.div
                                    layoutId="navbar-lamp"
                                    className="navbar__lamp-indicator"
                                    initial={false}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                >
                                    <div className="navbar__lamp-bar" />
                                    <div className="navbar__lamp-glow" />
                                </motion.div>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
