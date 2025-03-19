
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MessageBubble from '../components/messages/MessageBubble';
import ChatInput from '../components/messages/ChatInput';
import { Lock, UserPlus, Phone, Video, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Mock data for messages
const generateMockMessages = (contactId: string) => {
  const baseMessages = [
    {
      id: '1',
      content: 'Hello there! How are you doing today?',
      timestamp: new Date(Date.now() - 3600000 * 3),
      isSender: false,
    },
    {
      id: '2',
      content: 'I\'m doing well, thanks for asking! How about you?',
      timestamp: new Date(Date.now() - 3600000 * 2),
      isSender: true,
      status: 'read' as const,
    },
    {
      id: '3',
      content: 'I\'m great! Just wanted to check in.',
      timestamp: new Date(Date.now() - 3600000),
      isSender: false,
    },
    {
      id: '4',
      content: 'This is a secure message that will self-destruct after being read.',
      timestamp: new Date(Date.now() - 1800000),
      isSender: true,
      status: 'read' as const,
    }
  ];

  // Add some contact-specific messages
  if (contactId === '1') {
    baseMessages.push({
      id: '5',
      content: 'Have you seen the new security features? They\'re amazing!',
      timestamp: new Date(Date.now() - 900000),
      isSender: false,
    });
  } else if (contactId === '2') {
    baseMessages.push({
      id: '5',
      content: 'I\'ll send you the document when I get back to the office.',
      timestamp: new Date(Date.now() - 900000),
      isSender: false,
    });
  }

  return baseMessages;
};

const Index: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Select first contact by default when authenticated
  useEffect(() => {
    if (isAuthenticated && !selectedContactId) {
      setSelectedContactId('1');
    }
  }, [isAuthenticated, selectedContactId]);

  // Load messages when contact is selected
  useEffect(() => {
    if (selectedContactId) {
      setIsChatLoading(true);
      // Simulate loading messages
      setTimeout(() => {
        setMessages(generateMockMessages(selectedContactId));
        setIsChatLoading(false);
      }, 800);
    }
  }, [selectedContactId]);

  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
  };

  const handleSendMessage = (content: string, selfDestruct?: number) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isSender: true,
      status: 'sent' as const,
      selfDestruct
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate received message after delay
    if (Math.random() > 0.3) { // 70% chance to get a reply
      setTimeout(() => {
        const replies = [
          "Got it, thanks!",
          "I'll check that out.",
          "Sounds good to me.",
          "Thanks for letting me know.",
          "That's interesting.",
          "Perfect, I appreciate it."
        ];
        
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        setMessages(prev => [
          ...prev, 
          {
            id: Date.now().toString(),
            content: randomReply,
            timestamp: new Date(),
            isSender: false
          }
        ]);
      }, 2000 + Math.random() * 3000);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast({
      title: "Message deleted",
      description: "The message has been permanently deleted.",
    });
  };

  const handleSendAttachment = (file: File) => {
    // Create a URL for the file (in a real app, you'd upload this)
    const objectUrl = URL.createObjectURL(file);
    
    const isImage = file.type.startsWith('image/');
    
    const newMessage = {
      id: Date.now().toString(),
      content: "",
      timestamp: new Date(),
      isSender: true,
      status: 'sent' as const,
      attachments: [
        {
          id: Date.now().toString(),
          type: isImage ? 'image' : 'file',
          url: objectUrl,
          name: file.name,
          size: file.size
        }
      ]
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex flex-1 overflow-hidden">
        <Sidebar 
          onSelectContact={handleContactSelect}
          selectedContactId={selectedContactId || undefined}
        />
        
        <div className="flex-1 flex flex-col">
          {selectedContactId ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-medium">
                      {selectedContactId === '1' ? 'Alice Smith' : 
                       selectedContactId === '2' ? 'Bob Johnson' : 
                       selectedContactId === '3' ? 'Charlie Brown' : 
                       selectedContactId === '4' ? 'Diana Prince' : 
                       'Ethan Hunt'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      End-to-end encrypted conversation
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isChatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
                    
                    {messages.map(message => (
                      <MessageBubble
                        key={message.id}
                        id={message.id}
                        content={message.content}
                        timestamp={message.timestamp}
                        isSender={message.isSender}
                        status={message.status}
                        selfDestruct={message.selfDestruct}
                        attachments={message.attachments}
                        onDelete={() => handleDeleteMessage(message.id)}
                      />
                    ))}
                  </>
                )}
              </div>
              
              {/* Chat input */}
              <ChatInput 
                onSendMessage={handleSendMessage}
                onSendAttachment={handleSendAttachment}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UserPlus className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-medium mb-2">Select a conversation</h2>
              <p className="text-center text-muted-foreground max-w-md">
                Choose an existing conversation from the sidebar or start a new secure chat.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
