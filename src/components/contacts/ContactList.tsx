
import React from 'react';
import { User, UserPlus, Clock, Shield, Mail, Phone } from 'lucide-react';
import { useContacts, Contact } from '@/hooks/useContacts';

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
  const { contacts, isLoading } = useContacts();

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.phone && contact.phone.includes(searchQuery))
  );

  // Format time elapsed
  const formatTimeElapsed = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
    
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

  if (isLoading) {
    return (
      <div className="w-72 flex-shrink-0 border-r border-border p-4 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{contact.name}</p>
                    {contact.is_encrypted && (
                      <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>{formatTimeElapsed(contact.created_at)}</span>
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
