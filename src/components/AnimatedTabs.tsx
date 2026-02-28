'use client';

import { motion } from 'framer-motion';

interface Tab {
    id: string;
    label: string;
}

interface AnimatedTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export function AnimatedTabs({ tabs, activeTab, onTabChange }: AnimatedTabsProps) {
    return (
        <div className="animated-tabs">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        className={`animated-tabs__tab ${isActive ? 'animated-tabs__tab--active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <span className="animated-tabs__label">{tab.label}</span>
                        {isActive && (
                            <motion.div
                                layoutId="animated-tab-lamp"
                                className="animated-tabs__lamp"
                                initial={false}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 30,
                                }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
