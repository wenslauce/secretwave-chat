
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, Settings, Users, LogOut, 
  Lock, User, Phone, Bell, Moon, Search, 
  ArrowLeft, Shield, Video, History
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type SidebarProps = {
  onSelectContact?: (contactId: string) => void;
  selectedContactId?: string;
  activeLink?: string;
};

// Mock data for contacts
const mockContacts = [
  {
    id: '1',
    name: 'Alice Smith',
    status: 'online',
    avatar: '',
    unreadCount: 3
  },
  {
    id: '2',
    name: 'Bob Johnson',
    status: 'away',
    avatar: '',
    unreadCount: 0
  },
  {
    id: '3',
    name: 'Charlie Brown',
    status: 'offline',
    avatar: '',
    unreadCount: 0
  },
  {
    id: '4',
    name: 'Diana Prince',
    status: 'busy',
    avatar: '',
    unreadCount: 1
  },
  {
    id: '5',
    name: 'Ethan Hunt',
    status: 'online',
    avatar: '',
    unreadCount: 0
  }
];

const Sidebar: React.FC<SidebarProps> = ({ 
  onSelectContact = () => {}, 
  selectedContactId,
  activeLink
}) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const location = useLocation();
  
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

  const handleLogout = () => {
    logout();
    setIsLogoutDialogOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
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
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{user?.name || 'User'}</h3>
              <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
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
            
            <div className="space-y-1">
              {mockContacts.map(contact => (
                <button
                  key={contact.id}
                  className={`w-full flex items-center gap-3 p-2 rounded-md ${
                    selectedContactId === contact.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => onSelectContact(contact.id)}
                >
                  <div className="relative">
                    {contact.avatar ? (
                      <img 
                        src={contact.avatar} 
                        alt={contact.name} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${
                      contact.status === 'online' ? 'bg-green-500' :
                      contact.status === 'away' ? 'bg-yellow-500' :
                      contact.status === 'busy' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm truncate">{contact.name}</p>
                  </div>
                  {contact.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground">
                      {contact.unreadCount}
                    </div>
                  )}
                </button>
              ))}
            </div>
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
