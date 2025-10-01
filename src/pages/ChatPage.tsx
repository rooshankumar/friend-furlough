import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Mic, 
  Image, 
  Languages, 
  Globe,
  MoreVertical,
  Search,
  Phone,
  Video
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { CulturalBadge } from '@/components/CulturalBadge';

const ChatPage = () => {
  const { conversationId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { 
    conversations, 
    messages, 
    sendMessage, 
    loadConversations,
    loadMessages,
    markAsRead,
    setTypingStatus 
  } = useChatStore();
  
  const { user } = useAuthStore();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const currentConversation = conversationId 
    ? conversations.find(c => c.id === conversationId)
    : null;

  const conversationMessages = conversationId 
    ? messages[conversationId] || []
    : [];

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      markAsRead(conversationId);
    }
  }, [conversationId, loadMessages, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    try {
      await sendMessage({
        conversationId,
        senderId: user.id,
        content: newMessage.trim(),
        type: 'text'
      });
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

  if (!conversationId) {
    return (
      <div className="h-full bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Conversations
                    </CardTitle>
                    <Button size="sm" variant="outline">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    {conversations.map((conversation) => (
                      <div key={conversation.id} className="p-4 hover:bg-accent/50 cursor-pointer border-b border-border/50">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback className="bg-gradient-cultural text-white">
                              {conversation.participants[0]?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium truncate">
                                Cultural Exchange Partner
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(conversation.updatedAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <CulturalBadge type="country" flag="🇧🇷">Brazil</CulturalBadge>
                              <Badge variant="secondary" className="text-xs">
                                <Languages className="h-3 w-3 mr-1" />
                                Portuguese ↔ English
                              </Badge>
                            </div>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Welcome Message */}
            <div className="lg:col-span-3 flex items-center justify-center">
              <div className="text-center space-y-4">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List - Mobile Hidden */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Conversations
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  {conversations.map((conversation) => (
                    <div key={conversation.id} className={`p-4 hover:bg-accent/50 cursor-pointer border-b border-border/50 ${conversation.id === conversationId ? 'bg-accent/30' : ''}`}>
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback className="bg-gradient-cultural text-white">
                            {conversation.participants[0]?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium truncate">
                              Cultural Partner
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(conversation.updatedAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-gradient-cultural text-white">
                        M
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">Maria Santos</h3>
                      <div className="flex items-center gap-2">
                        <CulturalBadge type="country" flag="🇧🇷">Brazil</CulturalBadge>
                        <span className="text-sm text-muted-foreground">Online</span>
                        {isTyping && (
                          <span className="text-sm text-primary">typing...</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Languages className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-20rem)] p-4">
                  <div className="space-y-4">
                    {conversationMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${message.senderId === user?.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-accent text-accent-foreground'
                        } rounded-lg p-3`}>
                          <p>{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                            {message.language && (
                              <Badge variant="outline" className="text-xs ml-2">
                                {message.language}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Share your culture, practice languages..."
                      className="min-h-[2.5rem]"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-10 w-10 p-0">
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-10 w-10 p-0">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="h-10 w-10 p-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;