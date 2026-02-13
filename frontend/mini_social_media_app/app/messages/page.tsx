'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Search, Image as ImageIcon } from '@carbon/icons-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const MOCK_CONVERSATIONS = [
    { id: 1, user: { username: 'jane_doe', avatar_url: 'https://i.pravatar.cc/150?u=2' }, last_message: 'Hey, how are you?', unread: 2, timestamp: new Date().toISOString() },
    { id: 2, user: { username: 'mike_dev', avatar_url: 'https://i.pravatar.cc/150?u=3' }, last_message: 'Did you see the new update?', unread: 0, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, user: { username: 'sarah_c', avatar_url: 'https://i.pravatar.cc/150?u=4' }, last_message: 'Great, thanks!', unread: 0, timestamp: new Date(Date.now() - 86400000).toISOString() },
];

const MOCK_MESSAGES = [
    { id: 1, sender_id: 'me', content: 'Hi Jane!', timestamp: new Date(Date.now() - 36000000).toISOString() },
    { id: 2, sender_id: 'other', content: 'Hey! Long time no see.', timestamp: new Date(Date.now() - 35000000).toISOString() },
    { id: 3, sender_id: 'me', content: 'Yeah, I have been working on this new app.', timestamp: new Date(Date.now() - 3400000).toISOString() },
    { id: 4, sender_id: 'other', content: 'Oh nice! What tech stack?', timestamp: new Date(Date.now() - 3300000).toISOString() },
];

export default function MessagesPage() {
    const [selectedConversation, setSelectedConversation] = useState<any>(MOCK_CONVERSATIONS[0]);
    const [messageInput, setMessageInput] = useState('');

    return (
        <div className="flex h-[calc(100vh-4rem)] md:h-screen md:pt-0">
            {/* Conversation List */}
            <div className={cn(
                "w-full md:w-80 border-r bg-background flex flex-col",
                selectedConversation ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b space-y-4">
                    <h1 className="text-xl font-bold">Messages</h1>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 text-muted-foreground w-4 h-4" />
                        <Input placeholder="Search messages" className="pl-9 bg-muted/50" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {MOCK_CONVERSATIONS.map((conv) => (
                        <div
                            key={conv.id}
                            className={cn(
                                "flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/40",
                                selectedConversation?.id === conv.id && "bg-muted"
                            )}
                            onClick={() => setSelectedConversation(conv)}
                        >
                            <Avatar>
                                <AvatarImage src={conv.user.avatar_url} />
                                <AvatarFallback>{conv.user.username[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-semibold truncate">{conv.user.username}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {formatDistanceToNow(new Date(conv.timestamp), { addSuffix: false })}
                                    </span>
                                </div>
                                <p className={cn(
                                    "text-xs truncate",
                                    conv.unread > 0 ? "font-bold text-foreground" : "text-muted-foreground"
                                )}>
                                    {conv.last_message}
                                </p>
                            </div>
                            {conv.unread > 0 && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            {selectedConversation ? (
                <div className={cn(
                    "flex-1 flex flex-col h-full bg-background",
                    !selectedConversation ? "hidden md:flex" : "flex"
                )}>
                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" className="md:hidden p-0 mr-2" onClick={() => setSelectedConversation(null)}>
                                ←
                            </Button>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedConversation.user.avatar_url} />
                                <AvatarFallback>{selectedConversation.user.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{selectedConversation.user.username}</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {MOCK_MESSAGES.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex",
                                    msg.sender_id === 'me' ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                                        msg.sender_id === 'me'
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t bg-background">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                                <ImageIcon size={20} />
                            </Button>
                            <Input
                                placeholder="Type a message..."
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                className="flex-1 rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-input"
                            />
                            <Button size="icon" className="shrink-0 rounded-full" disabled={!messageInput.trim()}>
                                <Send size={18} />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground bg-muted/10">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">Select a conversation</h3>
                        <p>Choose a person from the list to start chatting</p>
                    </div>
                </div>
            )}
        </div>
    );
}
