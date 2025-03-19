
import React from 'react';
import { User, UserPlus, Clock, Shield, Mail, Phone, Video } from 'lucide-react';

// Mock data for contacts
const mockContacts = [
  {
    id: '1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    status: 'online',
    avatar: '',
    lastActive: new Date(),
    isEncrypted: true
  },
  {
    id: '2',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    status: 'away',
    avatar: '',
    lastActive: new Date(Date.now() - 3600000), // 1 hour ago
    isEncrypted: true
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    status: 'offline',
    avatar: '',
    lastActive: new Date(Date.now() - 86400000), // 1 day ago
    isEncrypted: false
  },
  {
    id: '4',
    name: 'Diana Prince',
    email: 'diana@example.com',
    status: 'busy',
    avatar: '',
    lastActive: new Date(Date.now() - 900000), // 15 minutes ago
    isEncrypted: true
  },
  {
    id: '5',
    name: 'Ethan Hunt',
    email: 'ethan@example.com',
    status: 'online',
    avatar: '',
    lastActive: new Date(Date.now() - 300000), // 5 minutes ago
    isEncrypted: true
  }
];

type ContactListProps = {
  searchQuery: string;
  selectedContactId: string | null;
  onSelectContact: (contactId: string) => void;
};

const ContactList: React.FC<ContactListProps> = ({
  searchQuery,
  selectedContactId,
  onSelectContact,
}) => {
  // Filter contacts based on search query
  const filteredContacts = mockContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time elapsed
  const formatTimeElapsed = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  };

  return (
    <div className="w-72 flex-shrink-0 border-r border-border overflow-y-auto">
      {filteredContacts.length > 0 ? (
        <ul className="divide-y divide-border">
          {filteredContacts.map(contact => (
            <li 
              key={contact.id}
              className={`p-3 hover:bg-secondary/50 cursor-pointer transition-colors ${
                selectedContactId === contact.id ? 'bg-secondary' : ''
              }`}
              onClick={() => onSelectContact(contact.id)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {contact.avatar ? (
                    <img 
                      src={contact.avatar} 
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{contact.name}</p>
                    {contact.isEncrypted && (
                      <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>{formatTimeElapsed(contact.lastActive)}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center h-full">
          <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No contacts found</p>
        </div>
      )}
    </div>
  );
};

export default ContactList;
