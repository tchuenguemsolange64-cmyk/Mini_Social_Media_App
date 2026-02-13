'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea'; // We need to add this component
import { Image as ImageIcon, Video, Send } from '@carbon/icons-react';
import { toast } from 'sonner';
import API from '@/utils/api';

export function CreatePost() {
    const { user, token } = useAuthStore();
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setIsLoading(true);
        try {
            const res = await API.post('/posts', { content, visibility: 'public' }, token || undefined);
            if (res.success) {
                toast.success('Post created!');
                setContent('');
                // TODO: Invalidate query or update global feed state
            } else {
                toast.error(res.error || 'Failed to post');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Card className="mb-6 border-border/50 shadow-sm">
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <textarea
                            className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[80px] text-base placeholder:text-muted-foreground/70"
                            placeholder="What's happening?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        <div className="flex items-center justify-between border-t pt-3">
                            <div className="flex gap-2 text-primary">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                                    <ImageIcon size={20} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                                    <Video size={20} />
                                </Button>
                            </div>
                            <Button
                                size="sm"
                                className="gap-2 rounded-full px-6"
                                onClick={handleSubmit}
                                disabled={!content.trim() || isLoading}
                            >
                                {isLoading ? 'Posting...' : 'Post'}
                                {!isLoading && <Send size={16} />}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
