
import React, { useState } from 'react';
import { 
  User, X, Mail, Phone, Video, 
  MessageSquare, Shield, ShieldOff, 
  Edit, Trash, Star, Calendar, Info, Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';

// Mock data for contacts (same as in ContactList)
const mockContacts = [
  {
    id: '1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '+1 (555) 123-4567',
    status: 'online',
    avatar: '',
    lastActive: new Date(),
    isEncrypted: true,
    isStarred: true,
    notes: 'Security researcher, prefers encrypted communication only.'
  },
  {
    id: '2',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+1 (555) 987-6543',
    status: 'away',
    avatar: '',
    lastActive: new Date(Date.now() - 3600000),
    isEncrypted: true,
    isStarred: false,
    notes: 'Work colleague, responds quickly to messages.'
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    phone: '+1 (555) 456-7890',
    status: 'offline',
    avatar: '',
    lastActive: new Date(Date.now() - 86400000),
    isEncrypted: false,
    isStarred: false,
    notes: ''
  },
  {
    id: '4',
    name: 'Diana Prince',
    email: 'diana@example.com',
    phone: '+1 (555) 234-5678',
    status: 'busy',
    avatar: '',
    lastActive: new Date(Date.now() - 900000),
    isEncrypted: true,
    isStarred: true,
    notes: 'Project manager, prefers calls over messages.'
  },
  {
    id: '5',
    name: 'Ethan Hunt',
    email: 'ethan@example.com',
    phone: '+1 (555) 789-0123',
    status: 'online',
    avatar: '',
    lastActive: new Date(Date.now() - 300000),
    isEncrypted: true,
    isStarred: false,
    notes: 'New contact, added from conference.'
  }
];

type ContactDetailProps = {
  contactId: string;
  onClose: () => void;
};

const ContactDetail: React.FC<ContactDetailProps> = ({ 
  contactId, 
  onClose 
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Find contact by ID
  const contact = mockContacts.find(c => c.id === contactId);
  
  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Contact not found</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleToggleEncryption = () => {
    // In a real app, this would update the contact's encryption status
    toast({
      title: contact.isEncrypted ? "Encryption disabled" : "Encryption enabled",
      description: `End-to-end encryption has been ${contact.isEncrypted ? 'disabled' : 'enabled'} for ${contact.name}.`,
    });
  };

  const handleToggleStar = () => {
    // In a real app, this would update the contact's starred status
    toast({
      title: contact.isStarred ? "Removed from favorites" : "Added to favorites",
      description: `${contact.name} has been ${contact.isStarred ? 'removed from' : 'added to'} your favorites.`,
    });
  };

  const handleDeleteContact = () => {
    // In a real app, this would delete the contact
    toast({
      title: "Contact deleted",
      description: `${contact.name} has been removed from your contacts.`,
      variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
    onClose();
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Contact Details</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex flex-col items-center mb-8">
        {contact.avatar ? (
          <img 
            src={contact.avatar} 
            alt={contact.name} 
            className="w-24 h-24 rounded-full object-cover mb-4"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-primary" />
          </div>
        )}
        <h3 className="text-xl font-medium">{contact.name}</h3>
        <div className="flex items-center gap-1 mt-1">
          <span className={`w-2.5 h-2.5 rounded-full ${
            contact.status === 'online' ? 'bg-green-500' :
            contact.status === 'away' ? 'bg-yellow-500' :
            contact.status === 'busy' ? 'bg-red-500' :
            'bg-gray-500'
          }`} />
          <span className="text-sm text-muted-foreground capitalize">{contact.status}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Contact Info</h4>
            <Button variant="ghost" size="sm" title="Edit contact">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{contact.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{contact.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Active</p>
                <p className="text-sm">{formatDate(contact.lastActive)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
          <div className="flex-1 p-3 bg-secondary/30 rounded-md text-sm">
            {contact.notes || 'No notes added for this contact.'}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            className="flex flex-col h-auto py-3 gap-1"
            title="Send message"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Message</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-auto py-3 gap-1"
            title="Start voice call"
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs">Call</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-auto py-3 gap-1"
            title="Start video call"
          >
            <Video className="w-5 h-5" />
            <span className="text-xs">Video</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-auto py-3 gap-1"
            title={contact.isStarred ? "Remove from favorites" : "Add to favorites"}
            onClick={handleToggleStar}
          >
            <Star className={`w-5 h-5 ${contact.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            <span className="text-xs">{contact.isStarred ? 'Starred' : 'Star'}</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-auto py-3 gap-1"
            title={contact.isEncrypted ? "Disable encryption" : "Enable encryption"}
            onClick={handleToggleEncryption}
          >
            {contact.isEncrypted ? (
              <Shield className="w-5 h-5 text-green-500" />
            ) : (
              <ShieldOff className="w-5 h-5" />
            )}
            <span className="text-xs">{contact.isEncrypted ? 'Encrypted' : 'Encrypt'}</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-auto py-3 gap-1 text-destructive hover:text-destructive"
            title="Delete contact"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="w-5 h-5" />
            <span className="text-xs">Delete</span>
          </Button>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {contact.name}? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteContact}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactDetail;
