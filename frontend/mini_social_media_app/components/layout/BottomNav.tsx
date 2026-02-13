'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Home,
    Compass,
    Notification,
    Chat,
    User,
    Add
} from '@carbon/icons-react';

const NAV_ITEMS = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Post', href: '/create', icon: Add, highlight: true },
    { label: 'Notifications', href: '/notifications', icon: Notification },
    { label: 'Profile', href: '/profile', icon: User },
];

export function BottomNav() {
    const pathname = usePathname();

    if (pathname === '/login' || pathname === '/signup') {
        return null;
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around px-2 z-50 pb-safe">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                const Icon = item.icon;

                if (item.highlight) {
                    return (
                        <Link key={item.href} href={item.href} className="relative -top-5">
                            <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg">
                                <Icon size={24} />
                            </div>
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex flex-col items-center justify-center w-full h-full text-muted-foreground transition-colors',
                            isActive && 'text-primary'
                        )}
                    >
                        <Icon size={24} />
                        <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
