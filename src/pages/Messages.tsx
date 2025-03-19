
import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useConversations } from '@/hooks/useConversations';
import { useContacts } from '@/hooks/useContacts';
import MessagesComponent from '@/components/messages/Messages';
import { 
  Loader2, MessageSquare, Plus, Search, User, Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from '@/hooks/use-toast';
import { initPresence, cleanupPresence } from '@/services/presenceService';

const Messages: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { conversations, isLoading: conversationsLoading, createConversation } = useConversations();
  const { contacts, isLoading: contactsLoading } = useContacts();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // Initialize presence tracking
  useEffect(() => {
    if (user?.id) {
      initPresence(user.id);
      
      return () => {
        cleanupPresence();
      };
    }
  }, [user]);

  // Set selected conversation when conversationId changes
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      } else {
        // Conversation not found, redirect to messages
        navigate('/messages');
      }
    } else if (conversations.length > 0 && !conversationId) {
      // Auto-select first conversation if none is selected
      setSelectedConversation(conversations[0]);
      navigate(`/messages/${conversations[0].id}`);
    }
  }, [conversationId, conversations, navigate]);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => 
    conversation.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get contact for the current 1:1 conversation
  const getCurrentContact = () => {
    if (!selectedConversation || selectedConversation.is_group) return null;
    
    const otherParticipant = selectedConversation.participants.find(
      p => p.user_id !== user?.id
    );
    
    if (!otherParticipant) return null;
    
    return {
      id: otherParticipant.user_id,
      name: otherParticipant.name,
      avatar_url: otherParticipant.avatar_url,
      status: otherParticipant.status
    };
  };

  const handleNewChat = async () => {
    if (!selectedContact) {
      toast({
        title: "No contact selected",
        description: "Please select a contact to start a conversation with.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newConversationId = await createConversation([selectedContact]);
      
      if (newConversationId) {
        setIsNewChatOpen(false);
        setSelectedContact(null);
        navigate(`/messages/${newConversationId}`);
        
        toast({
          title: "Conversation created",
          description: "You can now start messaging.",
        });
      }
    } catch (error) {
      toast({
        title: "Error creating conversation",
        description: "Failed to create a new conversation.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      // Less than a day, show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      // Less than a week, show day
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // More than a week, show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex flex-1 overflow-hidden">
        <Sidebar activeLink="messages" />
        
        <div className="w-80 flex-shrink-0 border-r border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Messages</h2>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setIsNewChatOpen(true)}
                title="New message"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredConversations.map(conversation => {
                  // For 1:1 conversations, get the other participant
                  const otherParticipant = !conversation.is_group
                    ? conversation.participants.find(p => p.user_id !== user?.id)
                    : null;
                    
                  return (
                    <div 
                      key={conversation.id}
                      className={`p-3 hover:bg-secondary/50 cursor-pointer ${
                        selectedConversation?.id === conversation.id ? 'bg-secondary' : ''
                      }`}
                      onClick={() => navigate(`/messages/${conversation.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {conversation.is_group ? (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                          ) : otherParticipant?.avatar_url ? (
                            <img 
                              src={otherParticipant.avatar_url} 
                              alt={conversation.name} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          
                          {!conversation.is_group && otherParticipant?.status && (
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                              otherParticipant.status === 'online' ? 'bg-green-500' :
                              otherParticipant.status === 'away' ? 'bg-yellow-500' :
                              otherParticipant.status === 'busy' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conversation.name}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
                              {formatTime(conversation.updated_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.last_message || 'No messages yet'}
                            </p>
                            
                            {conversation.unread_count > 0 && (
                              <div className="ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {conversation.unread_count}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">No conversations</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? 'No conversations match your search' 
                    : 'Start a new conversation with your contacts'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setIsNewChatOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Message
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <MessagesComponent 
              conversationId={selectedConversation.id}
              contact={getCurrentContact() || {
                id: '',
                name: selectedConversation.name || 'Group Chat'
              }}
              onInfoClick={() => {
                // In a real app, this would show conversation info
                toast({
                  title: "Conversation Info",
                  description: `${selectedConversation.participants.length} participants in this conversation.`,
                });
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-medium mb-2">Select a conversation</h2>
              <p className="text-center text-muted-foreground max-w-md">
                Choose an existing conversation from the sidebar or start a new one.
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => setIsNewChatOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            </div>
          )}
        </div>
      </main>
      
      {/* New Chat Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {contactsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Command>
                <CommandInput placeholder="Search contacts..." />
                <CommandList>
                  <CommandEmpty>No contacts found.</CommandEmpty>
                  <CommandGroup heading="Contacts">
                    {contacts.map(contact => (
                      <CommandItem
                        key={contact.id}
                        value={contact.id}
                        onSelect={() => setSelectedContact(contact.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            {contact.avatar_url ? (
                              <img 
                                src={contact.avatar_url} 
                                alt={contact.name} 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-background ${
                              contact.status === 'online' ? 'bg-green-500' :
                              contact.status === 'away' ? 'bg-yellow-500' :
                              contact.status === 'busy' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`} />
                          </div>
                          
                          <span>{contact.name}</span>
                          
                          {selectedContact === contact.id && (
                            <span className="ml-auto">✓</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleNewChat} 
              disabled={!selectedContact || contactsLoading}
            >
              Start Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
