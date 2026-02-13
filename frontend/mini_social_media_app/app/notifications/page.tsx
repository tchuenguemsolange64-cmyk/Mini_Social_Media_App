'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Notification, Chat, FavoriteFilled, UserFollow } from '@carbon/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        // Mock notifications
        setNotifications([
            { id: 1, type: 'like', user: { username: 'jane_doe', avatar_url: 'https://i.pravatar.cc/150?u=2' }, created_at: new Date().toISOString() },
            { id: 2, type: 'follow', user: { username: 'mike_dev', avatar_url: 'https://i.pravatar.cc/150?u=3' }, created_at: new Date(Date.now() - 3600000).toISOString() },
            { id: 3, type: 'comment', user: { username: 'sarah_c', avatar_url: 'https://i.pravatar.cc/150?u=4' }, created_at: new Date(Date.now() - 86400000).toISOString() },
        ]);
    }, []);

    return (
        <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
            <h1 className="text-2xl font-bold">Notifications</h1>

            <div className="space-y-2">
                {notifications.map((notif) => (
                    <Card key={notif.id} className="border-l-4 border-l-primary/50">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-full bg-muted">
                                {notif.type === 'like' && <FavoriteFilled className="text-red-500" size={20} />}
                                {notif.type === 'follow' && <UserFollow className="text-blue-500" size={20} />}
                                {notif.type === 'comment' && <Chat className="text-green-500" size={20} />}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={notif.user.avatar_url} />
                                        <AvatarFallback>{notif.user.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm">
                                        <span className="font-semibold">{notif.user.username}</span>
                                        <span className="text-muted-foreground ml-1">
                                            {notif.type === 'like' && 'liked your post'}
                                            {notif.type === 'follow' && 'started following you'}
                                            {notif.type === 'comment' && 'commented on your post'}
                                        </span>
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground mt-1 block">
                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                </span>
                            </div>

                            {notif.type === 'follow' && (
                                <Button size="sm" variant="outline">Follow Back</Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
