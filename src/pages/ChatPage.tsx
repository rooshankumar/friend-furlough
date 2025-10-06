import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Mic, 
  Image, 
  Globe,
  MoreVertical,
  Search,
  Trash2,
  Ban,
  Flag,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { CulturalBadge } from '@/components/CulturalBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ChatPage = () => {
  const { conversationId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { 
    conversations, 
    messages, 
    sendMessage, 
    loadConversations,
    loadMessages,
    markAsRead,
    subscribeToMessages,
    unsubscribeFromMessages
  } = useChatStore();
  
  const { user, profile } = useAuthStore();

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations(user.id);
    }
  }, [user, loadConversations]);

  // Load messages and subscribe to real-time updates
  useEffect(() => {
    if (conversationId && user) {
      loadMessages(conversationId);
      markAsRead(conversationId, user.id);
      const channel = subscribeToMessages(conversationId);
      
      return () => {
        unsubscribeFromMessages();
      };
    }
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[conversationId || '']]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    try {
      await sendMessage(conversationId, user.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentConversation = conversationId 
    ? conversations.find(c => c.id === conversationId)
    : null;

  const conversationMessages = conversationId 
    ? messages[conversationId] || []
    : [];
    
  const otherParticipant = currentConversation?.participants.find(
    p => p.user_id !== user?.id
  );

  if (!conversationId) {
    return (
      <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0">
        <div className="h-full flex flex-col md:flex-row">
          {/* Conversations List */}
          <div className="md:w-96 border-r border-border/50 bg-card/30 h-full flex flex-col">
            <div className="pb-4 p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Conversations
                </h2>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                    {conversations.map((conversation) => {
                      const otherUser = conversation.participants.find(p => p.user_id !== user?.id);
                      const participantProfile = otherUser?.profiles;
                      
                      return (
                        <Link key={conversation.id} to={`/chat/${conversation.id}`}>
                          <div className="p-4 hover:bg-accent/50 cursor-pointer border-b border-border/50">
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={participantProfile?.avatar_url} />
                                <AvatarFallback className="bg-gradient-cultural text-white">
                                  {participantProfile?.name?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium truncate">
                                    {participantProfile?.name || 'Unknown User'}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {conversation.lastMessage ? new Date(conversation.lastMessage.created_at).toLocaleTimeString() : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.lastMessage?.content || 'No messages yet'}
                                </p>
                                {participantProfile?.country_flag && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm">{participantProfile.country_flag}</span>
                                  </div>
                                )}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-primary text-primary-foreground">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
            </div>
          </div>

          {/* Welcome Message - Only show on desktop or when no conversations */}
          {(conversations.length === 0 || window.innerWidth >= 768) && (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center space-y-4 p-8">
                <div className="w-24 h-24 mx-auto bg-gradient-cultural rounded-full flex items-center justify-center">
                  <Globe className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Start Cultural Conversations
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Select a conversation to start practicing languages and sharing cultures with friends around the world.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-0 md:pb-0">
      <div className="h-full flex">
        {/* Conversations List - Desktop Only */}
        <div className="hidden lg:flex lg:w-72 border-r border-border/50 bg-card/30 flex-col flex-shrink-0">
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Chats
              </h2>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => {
              const otherUser = conversation.participants.find(p => p.user_id !== user?.id);
              const participantProfile = otherUser?.profiles;
              
              return (
                <Link key={conversation.id} to={`/chat/${conversation.id}`}>
                  <div className={`p-3 hover:bg-accent/50 cursor-pointer border-b border-border/50 ${
                    conversation.id === conversationId ? 'bg-accent/50' : ''
                  }`}>
                    <div className="flex items-start space-x-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participantProfile?.avatar_url} />
                        <AvatarFallback className="bg-gradient-cultural text-white">
                          {participantProfile?.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate text-sm">
                            {participantProfile?.name || 'Unknown User'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex-1 bg-background flex flex-col h-full">
          {/* Chat Header - Fixed */}
          <div className="flex-shrink-0 border-b border-border/50 py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link to="/chat" className="lg:hidden">
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherParticipant?.profiles?.avatar_url} />
                  <AvatarFallback className="bg-gradient-cultural text-white">
                    {otherParticipant?.profiles?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">{otherParticipant?.profiles?.name || 'Unknown User'}</h3>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="text-destructive cursor-pointer">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Conversation
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <Ban className="mr-2 h-4 w-4" />
                      Block User
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Flag className="mr-2 h-4 w-4" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="space-y-2">
              {conversationMessages.map((message, index) => {
                const currentDate = new Date(message.created_at).toDateString();
                const previousDate = index > 0 
                  ? new Date(conversationMessages[index - 1].created_at).toDateString()
                  : null;
                const showDateSeparator = currentDate !== previousDate;

                return (
                  <React.Fragment key={message.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {new Date(message.created_at).toLocaleDateString('en-US', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    <div 
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] sm:max-w-[60%] ${message.sender_id === user?.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-accent text-accent-foreground'
                      } rounded-2xl px-3 py-2`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input - Fixed at Bottom */}
          <div className="flex-shrink-0 p-3 border-t border-border/50 bg-background">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 flex-shrink-0">
                <Image className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="h-9 text-sm"
                />
              </div>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 flex-shrink-0">
                <Mic className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="h-9 w-9 p-0 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
