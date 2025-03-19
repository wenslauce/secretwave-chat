
import React, { useState, useEffect, useRef } from 'react';
import { useMessages, Message as MessageType } from '@/hooks/useMessages';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { User, Loader2, Lock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type MessagesProps = {
  conversationId: string;
  contact: {
    id: string;
    name: string;
    avatar_url?: string;
    status?: string;
  };
  onInfoClick?: () => void;
};

const Messages: React.FC<MessagesProps> = ({ 
  conversationId, 
  contact,
  onInfoClick
}) => {
  const { user } = useAuth();
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    markMessagesAsRead,
    deleteMessage 
  } = useMessages(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
    
    // Count unread messages
    const unread = messages.filter(msg => 
      msg.sender_id !== user?.id && msg.status !== 'read'
    ).length;
    
    setUnreadCount(unread);
    
    // Mark messages as read if we're at the bottom
    if (isAtBottom && unread > 0) {
      markMessagesAsRead();
    }
  }, [messages]);

  // Subscribe to typing indicators
  useEffect(() => {
    const typingChannel = supabase.channel('typing-channel');
    
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.conversationId === conversationId && 
            payload.payload.userId !== user?.id) {
          setIsTyping(true);
          setTypingUser(payload.payload.userName);
          
          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            setIsTyping(false);
            setTypingUser(null);
          }, 3000);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [conversationId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isBottom = scrollHeight - scrollTop <= clientHeight + 50;
    setIsAtBottom(isBottom);
    
    if (isBottom && unreadCount > 0) {
      markMessagesAsRead();
      setUnreadCount(0);
    }
  };

  const handleSendMessage = async (content: string, selfDestruct?: number) => {
    if (!content.trim() && !selfDestruct) return;
    
    await sendMessage(content, selfDestruct);
  };

  const handleSendAttachment = async (file: File) => {
    await sendMessage('', undefined, [file]);
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId);
  };

  const broadcastTyping = () => {
    const typingChannel = supabase.channel('typing-channel');
    
    typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { 
        conversationId, 
        userId: user?.id,
        userName: user?.name || 'Someone'
      },
    });
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-2">Error loading messages</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            {contact.avatar_url ? (
              <img 
                src={contact.avatar_url} 
                alt={contact.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
              contact.status === 'online' ? 'bg-green-500' :
              contact.status === 'away' ? 'bg-yellow-500' :
              contact.status === 'busy' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
          </div>
          <div>
            <h2 className="font-medium">{contact.name}</h2>
            <p className="text-xs text-muted-foreground">
              {isTyping ? (
                <span className="text-primary font-medium">Typing...</span>
              ) : (
                contact.status || 'Offline'
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={onInfoClick}
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Chat messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-1">End-to-end encrypted</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Messages and calls are end-to-end encrypted. No one outside of this chat, not even OffTheRadar, can read or listen to them.
              </p>
            </div>
            
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                id={message.id}
                content={message.content}
                timestamp={new Date(message.created_at)}
                isSender={message.sender_id === user?.id}
                status={message.status}
                selfDestruct={message.self_destruct_seconds || undefined}
                attachments={message.attachments?.map(att => ({
                  id: att.id,
                  type: att.file_type.startsWith('image/') ? 'image' : 'file',
                  url: att.file_url,
                  name: att.file_name,
                  size: att.file_size
                }))}
                senderName={message.sender_id === user?.id ? undefined : message.sender_name}
                senderAvatar={message.sender_id === user?.id ? undefined : message.sender_avatar}
                onDelete={() => handleDeleteMessage(message.id)}
              />
            ))}
            
            {isTyping && (
              <div className="flex items-center space-x-2 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animation-delay-200"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animation-delay-500"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Scroll to bottom button */}
      {!isAtBottom && unreadCount > 0 && (
        <div className="absolute bottom-20 right-4">
          <Button 
            variant="secondary" 
            size="sm" 
            className="rounded-full shadow-md"
            onClick={scrollToBottom}
          >
            {unreadCount} new {unreadCount === 1 ? 'message' : 'messages'} ↓
          </Button>
        </div>
      )}
      
      {/* Chat input */}
      <ChatInput 
        onSendMessage={handleSendMessage}
        onSendAttachment={handleSendAttachment}
        onTyping={broadcastTyping}
        disabled={isLoading}
      />
    </div>
  );
};

export default Messages;
