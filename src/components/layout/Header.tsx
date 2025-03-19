
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LockKeyhole, 
  Menu, 
  X, 
  Settings, 
  LogOut, 
  User,
  Bell
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
            <LockKeyhole className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xl font-semibold tracking-tight">OffTheRadar</span>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Messages
            </Link>
            <Link 
              to="/contacts" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Contacts
            </Link>
            <Link 
              to="/settings" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Settings
            </Link>
          </nav>
        )}

        {user && (
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-secondary transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            
            <div className="relative">
              <button 
                onClick={toggleMenu}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <span className="hidden md:inline-block text-sm font-medium">
                  {user.name}
                </span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-card rounded-lg overflow-hidden shadow-lg animate-fade-in">
                  <div className="p-4 border-b border-border">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link 
                      to="/profile"
                      className="flex items-center gap-2 p-2 text-sm rounded-md hover:bg-secondary/50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </Link>
                    <Link 
                      to="/settings"
                      className="flex items-center gap-2 p-2 text-sm rounded-md hover:bg-secondary/50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 text-sm rounded-md hover:bg-secondary/50 text-left transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button 
              className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {user && isMenuOpen && (
        <div className="md:hidden border-t border-border animate-fade-in">
          <div className="container py-3 px-4 space-y-1">
            <Link 
              to="/" 
              className="block p-2 rounded-md hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Messages
            </Link>
            <Link 
              to="/contacts" 
              className="block p-2 rounded-md hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contacts
            </Link>
            <Link 
              to="/settings" 
              className="block p-2 rounded-md hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
