'use client';

import React, { useState } from 'react';
import { use } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/post/PostCard';
import { Settings, Grid, Link as LinkIcon, Calendar } from '@carbon/icons-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock User Data
const MOCK_USER = {
    id: '2',
    username: 'jane_doe',
    display_name: 'Jane Doe',
    avatar_url: 'https://i.pravatar.cc/150?u=2',
    bio: 'Digital nomad & full-stack developer. Loves coffee and code. ☕️💻',
    location: 'San Francisco, CA',
    website: 'jane.dev',
    join_date: 'Joined March 2024',
    following: 124,
    followers: 1205,
    posts_count: 45,
};

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    // Unwrap params using React.use()
    const { username } = use(params);
    const [isFollowing, setIsFollowing] = useState(false);

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background ring-2 ring-border">
                    <AvatarImage src={MOCK_USER.avatar_url} />
                    <AvatarFallback>{MOCK_USER.display_name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{MOCK_USER.display_name}</h1>
                            <p className="text-muted-foreground">@{username}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={isFollowing ? "outline" : "default"}
                                onClick={() => setIsFollowing(!isFollowing)}
                                className="min-w-[100px]"
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </Button>
                            <Button variant="outline" size="icon">
                                <Settings size={20} />
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-sm">
                        <div className="flex gap-1">
                            <span className="font-bold">{MOCK_USER.posts_count}</span>
                            <span className="text-muted-foreground">posts</span>
                        </div>
                        <div className="flex gap-1">
                            <span className="font-bold">{MOCK_USER.followers}</span>
                            <span className="text-muted-foreground">followers</span>
                        </div>
                        <div className="flex gap-1">
                            <span className="font-bold">{MOCK_USER.following}</span>
                            <span className="text-muted-foreground">following</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm border-l-2 border-primary/50 pl-3 italic">{MOCK_USER.bio}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                            {MOCK_USER.location && <span>📍 {MOCK_USER.location}</span>}
                            {MOCK_USER.website && (
                                <a href={`https://${MOCK_USER.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                                    <LinkIcon size={12} /> {MOCK_USER.website}
                                </a>
                            )}
                            <span className="flex items-center gap-1"><Calendar size={12} /> {MOCK_USER.join_date}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs / Content */}
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 mb-6">
                    <TabsTrigger
                        value="posts"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3 pt-2"
                    >
                        <Grid size={16} className="mr-2" />
                        Posts
                    </TabsTrigger>
                    <TabsTrigger
                        value="media"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3 pt-2"
                    >
                        Media
                    </TabsTrigger>
                    <TabsTrigger
                        value="likes"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3 pt-2"
                    >
                        Likes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-6">
                    {/* Mock Post List */}
                    <PostCard post={{
                        id: '1',
                        content: 'Pinned post! 📌',
                        created_at: new Date().toISOString(),
                        author: MOCK_USER,
                        likes_count: 100,
                        comments_count: 20,
                        has_liked: false,
                        media_urls: ['https://images.unsplash.com/photo-1510759395231-72b17d622279?auto=format&fit=crop&w=800&q=80']
                    }} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
