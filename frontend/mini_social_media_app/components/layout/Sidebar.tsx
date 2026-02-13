'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Home,
    Compass,
    Notification,
    Chat,
    User,
    Settings,
    Logout,
    Add
} from '@carbon/icons-react';
import { useAuthStore } from '@/store/useAuthStore';

// Define navigation items
const NAV_ITEMS = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Notifications', href: '/notifications', icon: Notification },
    { label: 'Messages', href: '/messages', icon: Chat },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter(); // Initialize router
    const { user, logout } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login'); // Use router.push instead of window.location
    };

    if (pathname === '/login' || pathname === '/signup') {
        return null;
    }

    // Only render user-dependent content accurately after mounting to prevent hydration mismatch
    // But we can render the structure regardless.

    return (
        <aside className="hidden md:flex flex-col h-screen w-64 border-r fixed left-0 top-0 bg-background z-50 p-4">
            <div className="flex items-center gap-2 mb-8 px-2">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                    M
                </div>
                <h1 className="text-xl font-bold tracking-tight">Mini Social</h1>
            </div>

            <nav className="flex-1 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? 'secondary' : 'ghost'}
                                className={cn(
                                    'w-full justify-start gap-4 text-base font-medium h-12',
                                    isActive && 'font-semibold'
                                )}
                            >
                                <Icon size={24} />
                                {item.label}
                            </Button>
                        </Link>
                    );
                })}

                <Button className="w-full mt-4 gap-2" size="lg">
                    <Add size={20} />
                    Create Post
                </Button>
            </nav>

            <div className="border-t pt-4 mt-auto">
                {mounted ? (
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <Avatar>
                            <AvatarImage src={user?.avatar_url} />
                            <AvatarFallback>{user?.display_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.display_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">@{user?.username || 'username'}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-2 mb-4 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted w-3/4 rounded"></div>
                            <div className="h-3 bg-muted w-1/2 rounded"></div>
                        </div>
                    </div>
                )}

                <Button variant="ghost" className="w-full justify-start gap-4 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                    <Logout size={20} />
                    Logout
                </Button>
            </div>
        </aside>
    );
}
