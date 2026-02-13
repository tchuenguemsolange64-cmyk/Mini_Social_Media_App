'use client';

import React, { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Add } from '@carbon/icons-react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const MOCK_STORIES = [
    { id: 1, username: 'you', isUser: true },
    { id: 2, username: 'jane_doe', hasStory: true },
    { id: 3, username: 'john_smith', hasStory: true },
    { id: 4, username: 'sarah_c', hasStory: true },
    { id: 5, username: 'mike_r', hasStory: true },
    { id: 6, username: 'alex_t', hasStory: true },
    { id: 7, username: 'emily_w', hasStory: true },
];

export function StoryRail() {
    const scrollRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Optional: Add entrance animation for stories
        gsap.from('.story-item', {
            y: 20,
            opacity: 0,
            stagger: 0.1,
            duration: 0.5,
            ease: 'power2.out',
        });
    }, { scope: scrollRef });

    return (
        <div
            ref={scrollRef}
            className="w-full overflow-x-auto pb-4 mb-2 scrollbar-none"
        >
            <div className="flex gap-4 px-1 min-w-max">
                {MOCK_STORIES.map((story) => (
                    <div
                        key={story.id}
                        className="story-item flex flex-col items-center gap-2 cursor-pointer group"
                    >
                        <div className={cn(
                            "relative p-[2px] rounded-full transition-transform duration-300 group-hover:scale-105",
                            story.hasStory
                                ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500"
                                : "bg-transparent border-2 border-dashed border-muted-foreground/30"
                        )}>
                            <div className="bg-background rounded-full p-[2px]">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${story.id}`} />
                                    <AvatarFallback>{story.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>

                            {story.isUser && (
                                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 border-2 border-background">
                                    <Add size={12} />
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium max-w-[70px] truncate text-center">
                            {story.isUser ? 'Your Story' : story.username}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
