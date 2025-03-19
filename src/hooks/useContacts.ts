
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_encrypted: boolean;
  status?: string;
  avatar_url?: string;
  created_at: string;
};

export const useContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          name,
          email,
          phone,
          is_encrypted,
          created_at,
          contact_id,
          profiles:contact_id(
            id,
            name,
            avatar_url,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        throw error;
      }

      // Transform the data to match our Contact type
      const transformedContacts: Contact[] = data.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone || undefined,
        is_encrypted: contact.is_encrypted,
        status: contact.profiles?.status,
        avatar_url: contact.profiles?.avatar_url,
        created_at: contact.created_at
      }));

      setContacts(transformedContacts);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error loading contacts",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addContact = async (contact: Omit<Contact, 'id' | 'created_at'>) => {
    if (!user) return null;

    try {
      // First check if contact exists in auth system
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', contact.email)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw userError;
      }

      if (!userData) {
        toast({
          title: "User not found",
          description: `No user with email ${contact.email} was found in the system.`,
          variant: "destructive",
        });
        return null;
      }

      // Add contact
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          contact_id: userData.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          is_encrypted: contact.is_encrypted
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          toast({
            title: "Contact already exists",
            description: "This contact is already in your contacts list.",
            variant: "destructive",
          });
          return null;
        }
        throw error;
      }

      await fetchContacts(); // Refresh contacts list
      
      toast({
        title: "Contact added",
        description: `${contact.name} has been added to your contacts.`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error adding contact",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateContact = async (id: string, updates: Partial<Omit<Contact, 'id' | 'created_at'>>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      await fetchContacts(); // Refresh contacts list
      
      toast({
        title: "Contact updated",
        description: "Contact information has been updated.",
      });
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error updating contact",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const deleteContact = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setContacts(contacts.filter(contact => contact.id !== id));
      
      toast({
        title: "Contact deleted",
        description: "Contact has been removed from your contacts.",
      });
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error deleting contact",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    contacts,
    isLoading,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact
  };
};
