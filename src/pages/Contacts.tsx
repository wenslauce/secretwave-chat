
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import ContactList from '../components/contacts/ContactList';
import ContactDetail from '../components/contacts/ContactDetail';
import AddContactDialog from '../components/contacts/AddContactDialog';
import { Button } from "@/components/ui/button";
import { UserPlus, Filter, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { toast } from '@/hooks/use-toast';

const Contacts: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  
  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleAddContact = (name: string, email: string) => {
    // In a real app, this would add the contact to your database
    toast({
      title: "Contact added",
      description: `${name} (${email}) has been added to your contacts.`,
    });
    setIsAddContactOpen(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex flex-1 overflow-hidden">
        <Sidebar 
          onSelectContact={id => {}} 
          activeLink="contacts"
        />
        
        <div className="flex-1 flex flex-col">
          {/* Contacts header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h1 className="text-xl font-semibold">Contacts</h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="w-[250px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                title="Filter contacts"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => setIsAddContactOpen(true)}
              >
                <UserPlus className="mr-1 h-4 w-4" />
                Add Contact
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            {/* Contacts list */}
            <ContactList 
              searchQuery={searchQuery}
              selectedContactId={selectedContactId}
              onSelectContact={setSelectedContactId}
            />
            
            {/* Contact details */}
            {selectedContactId ? (
              <ContactDetail
                contactId={selectedContactId}
                onClose={() => setSelectedContactId(null)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-medium mb-2">Select a contact</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  Choose a contact from the list to view details or add a new contact.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddContactOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New Contact
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <AddContactDialog 
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        onAddContact={handleAddContact}
      />
    </div>
  );
};

export default Contacts;
