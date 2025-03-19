
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, Settings, Users, LogOut, 
  Lock, User, Phone, Search, 
  ArrowLeft, Shield, Video, History
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useConversations } from '@/hooks/useConversations';
import { initPresence, updateUserStatus, cleanupPresence } from '@/services/presenceService';

type SidebarProps = {
  onSelectContact?: (contactId: string) => void;
  selectedContactId?: string;
  activeLink?: string;
};

const Sidebar: React.FC<SidebarProps> = ({ 
  onSelectContact = () => {}, 
  selectedContactId,
  activeLink
}) => {
  const { user, profile, logout } = useAuth();
  const { conversations, isLoadingConversations, setActiveConversation } = useConversations();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const location = useLocation();
  
  // Initialize presence tracking when user is authenticated
  useEffect(() => {
    if (user) {
      initPresence(user.id);
      
      return () => {
        cleanupPresence();
      };
    }
  }, [user]);
  
  // Determine if we're on the home/chat page
  const isHomePage = location.pathname === '/';
  
  // Active link state
  const getActiveClass = (path: string) => {
    if (path === '/' && isHomePage) return "bg-primary/10 text-primary";
    if (path === '/contacts' && activeLink === 'contacts') return "bg-primary/10 text-primary";
    if (path === '/calls' && activeLink === 'calls') return "bg-primary/10 text-primary";
    if (path === '/settings' && activeLink === 'settings') return "bg-primary/10 text-primary";
    return "text-muted-foreground hover:bg-secondary";
  };

  const handleLogout = async () => {
    if (user) {
      // Set status to offline before logging out
      await updateUserStatus(user.id, 'offline');
    }
    await logout();
    setIsLogoutDialogOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleConversationSelect = (conversation: any) => {
    setActiveConversation(conversation);
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <>
      {/* Mobile menu toggle */}
      <button 
        className="lg:hidden fixed top-16 left-4 z-20 p-2 rounded-full bg-background border border-border shadow-md"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? (
          <ArrowLeft className="w-5 h-5" />
        ) : (
          <MessageSquare className="w-5 h-5" />
        )}
      </button>
      
      {/* Sidebar */}
      <aside className={`w-64 border-r border-border flex flex-col ${
        isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-10 bg-background pt-16' : 'hidden lg:flex'
      }`}>
        {/* User profile section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.name || 'User'} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-medium">{profile?.name || user?.email || 'User'}</h3>
              <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
            </div>
          </div>
        </div>
        
        {/* Main navigation */}
        <nav className="p-2 space-y-1">
          <Link to="/">
            <Button
              variant="ghost"
              className={`w-full justify-start ${getActiveClass('/')}`}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Button>
          </Link>
          
          <Link to="/contacts">
            <Button
              variant="ghost"
              className={`w-full justify-start ${getActiveClass('/contacts')}`}
            >
              <Users className="mr-2 h-4 w-4" />
              Contacts
            </Button>
          </Link>
          
          <Link to="/calls">
            <Button
              variant="ghost"
              className={`w-full justify-start ${getActiveClass('/calls')}`}
            >
              <Phone className="mr-2 h-4 w-4" />
              Calls
            </Button>
          </Link>
          
          <Link to="/settings">
            <Button
              variant="ghost"
              className={`w-full justify-start ${getActiveClass('/settings')}`}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </nav>
        
        {/* Recent chats section (only show on home page) */}
        {isHomePage && (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center justify-between mb-2 px-2">
              <h4 className="text-xs font-medium text-muted-foreground">Recent Chats</h4>
              <button className="text-xs text-primary hover:underline">View All</button>
            </div>
            
            {isLoadingConversations ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : conversations.length > 0 ? (
              <div className="space-y-1">
                {conversations.map(conversation => {
                  // For direct chats, find the other participant
                  const otherParticipant = !conversation.is_group 
                    ? conversation.participants.find(p => p.user_id !== user?.id)
                    : null;

                  return (
                    <button
                      key={conversation.id}
                      className={`w-full flex items-center gap-3 p-2 rounded-md ${
                        selectedContactId === conversation.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => handleConversationSelect(conversation)}
                    >
                      <div className="relative">
                        {otherParticipant?.avatar_url ? (
                          <img 
                            src={otherParticipant.avatar_url} 
                            alt={conversation.name || 'Chat'} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {conversation.is_group ? (
                              <Users className="w-4 h-4 text-primary" />
                            ) : (
                              <User className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        )}
                        {otherParticipant && (
                          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${
                            otherParticipant.status === 'online' ? 'bg-green-500' :
                            otherParticipant.status === 'away' ? 'bg-yellow-500' :
                            otherParticipant.status === 'busy' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm truncate">
                          {conversation.name || otherParticipant?.name || 'Unknown'}
                        </p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="w-5 h-5 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground">
                          {conversation.unread_count}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No conversations yet
              </div>
            )}
          </div>
        )}
        
        {/* Bottom actions */}
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-secondary"
            onClick={() => setIsLogoutDialogOpen(true)}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      
      {/* Logout confirmation dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout from OffTheRadar?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar;
