'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import API from '@/utils/api';
import { StoryRail } from '@/components/story/StoryRail';
import { CreatePost } from '@/components/post/CreatePost';
import { PostCard } from '@/components/post/PostCard';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    }
  }, [isAuthenticated]);

  const fetchFeed = async () => {
    try {
      // Mock data for now until we have real posts from API
      // const res = await API.get('/posts/feed');
      // if (res.success) setPosts(res.data);

      // Simulating delay
      setTimeout(() => {
        setPosts([
          {
            id: '1',
            content: 'Just setting up my new premium social media app! 🚀 #coding #nextjs',
            created_at: new Date().toISOString(),
            author: {
              id: '2',
              username: 'jane_doe',
              display_name: 'Jane Doe',
              avatar_url: 'https://i.pravatar.cc/150?u=2'
            },
            likes_count: 42,
            comments_count: 5,
            has_liked: false,
            media_urls: ['https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80']
          },
          {
            id: '2',
            content: 'Loving the dark mode on this thing. shadcn/ui is a game changer.',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            author: {
              id: '3',
              username: 'mike_dev',
              display_name: 'Mike Developer',
              avatar_url: 'https://i.pravatar.cc/150?u=3'
            },
            likes_count: 12,
            comments_count: 2,
            has_liked: true
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch feed', error);
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary font-bold">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <header className="flex items-center justify-between mb-6 md:hidden">
        <h1 className="text-xl font-bold">Mini Social</h1>
      </header>

      {/* Stories */}
      <StoryRail />

      {/* Create Post */}
      <CreatePost />

      {/* Posts Feed */}
      <div className="space-y-6">
        {isLoading ? (
          // Loading Skeletons
          [1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
                <Skeleton className="h-48 w-full rounded-md" />
              </CardContent>
            </Card>
          ))
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p>No posts yet. Follow someone to see their posts!</p>
            <Button variant="link" onClick={() => router.push('/explore')}>
              Explore Users
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
