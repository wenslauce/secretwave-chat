
import React, { useState } from 'react';
import { Search, Plus, User, Users, Clock, ChevronRight } from 'lucide-react';

// Mock data for contacts
const mockContacts = [
  { id: '1', name: 'Alice Smith', status: 'online', lastSeen: new Date(), unread: 3 },
  { id: '2', name: 'Bob Johnson', status: 'offline', lastSeen: new Date(Date.now() - 3600000) },
  { id: '3', name: 'Charlie Brown', status: 'online', lastSeen: new Date() },
  { id: '4', name: 'Diana Prince', status: 'offline', lastSeen: new Date(Date.now() - 86400000) },
  { id: '5', name: 'Ethan Hunt', status: 'online', lastSeen: new Date(), unread: 1 },
];

type Contact = {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  unread?: number;
};

type SidebarProps = {
  onSelectContact: (contactId: string) => void;
  selectedContactId?: string;
};

const Sidebar: React.FC<SidebarProps> = ({ 
  onSelectContact,
  selectedContactId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const filteredContacts = mockContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className={`h-full flex flex-col border-r border-border transition-all duration-300 ${
      isExpanded ? 'w-80' : 'w-16'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className={`font-semibold transition-opacity duration-200 ${
          isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
        }`}>
          Conversations
        </h2>
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-secondary transition-colors"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`} />
        </button>
      </div>

      {isExpanded && (
        <div className="p-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <Search size={16} />
            </div>
            <input
              type="search"
              className="w-full pl-10 py-2 bg-secondary/50 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-none">
        <nav className="p-2 space-y-1">
          {isExpanded ? (
            filteredContacts.map(contact => (
              <button
                key={contact.id}
                className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors ${
                  selectedContactId === contact.id
                    ? 'bg-secondary'
                    : 'hover:bg-secondary/50'
                }`}
                onClick={() => onSelectContact(contact.id)}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User size={20} className="text-primary" />
                  </div>
                  {contact.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-medium truncate">{contact.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {contact.lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.status === 'online' ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
                {contact.unread && (
                  <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                    {contact.unread}
                  </span>
                )}
              </button>
            ))
          ) : (
            // Collapsed sidebar - show only avatars
            <div className="flex flex-col items-center space-y-4 mt-4">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  className={`relative p-1 rounded-full transition-colors ${
                    selectedContactId === contact.id
                      ? 'bg-secondary'
                      : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => onSelectContact(contact.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User size={16} className="text-primary" />
                  </div>
                  {contact.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-background rounded-full"></span>
                  )}
                  {contact.unread && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                      {contact.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className="p-3 border-t border-border">
        <button 
          className={`w-full flex items-center justify-center gap-2 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ${
            !isExpanded && 'p-2'
          }`}
        >
          <Plus size={isExpanded ? 18 : 16} />
          {isExpanded && <span>New conversation</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
