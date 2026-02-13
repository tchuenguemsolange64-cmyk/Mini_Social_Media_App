'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Favorite, FavoriteFilled, Chat, Share, Send } from '@carbon/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface User {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
}

interface PostProps {
    post: {
        id: string;
        content: string;
        media_urls?: string[];
        created_at: string;
        author: User;
        likes_count: number;
        comments_count: number;
        has_liked: boolean;
    };
}

export function PostCard({ post }: PostProps) {
    const [isLiked, setIsLiked] = useState(post.has_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const likeIconRef = useRef(null);

    const { contextSafe } = useGSAP();

    const handleLike = contextSafe(() => {
        // Optimistic UI update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

        if (newIsLiked) {
            gsap.fromTo(
                likeIconRef.current,
                { scale: 0.5, opacity: 0.5 },
                { scale: 1.2, opacity: 1, duration: 0.2, ease: 'back.out(1.7)', yoyo: true, repeat: 1 }
            );
        }

        // TODO: Call API to toggle like
        // API.post(`/posts/${post.id}/like`, {});
    });

    return (
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
                <Link href={`/u/${post.author.username}`}>
                    <Avatar className="cursor-pointer border-2 border-background ring-1 ring-border">
                        <AvatarImage src={post.author.avatar_url} />
                        <AvatarFallback>{post.author.display_name[0]}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex flex-col">
                    <Link href={`/u/${post.author.username}`} className="font-semibold hover:underline">
                        {post.author.display_name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                        @{post.author.username} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>

                {post.media_urls && post.media_urls.length > 0 && (
                    <div className="rounded-lg overflow-hidden border bg-muted/30">
                        {/* Simple grid for media - can be enhanced */}
                        {post.media_urls.map((url, index) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                key={index}
                                src={url}
                                alt="Post content"
                                className="w-full h-auto max-h-[500px] object-cover"
                                loading="lazy"
                            />
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-2 border-t flex items-center justify-between">
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors",
                            isLiked && "text-red-500"
                        )}
                        onClick={handleLike}
                    >
                        <div ref={likeIconRef}>
                            {isLiked ? <FavoriteFilled size={20} /> : <Favorite size={20} />}
                        </div>
                        <span>{likesCount}</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <Chat size={20} />
                        <span>{post.comments_count}</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10">
                        <Share size={20} />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
