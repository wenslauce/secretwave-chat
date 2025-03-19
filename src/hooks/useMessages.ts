
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { encryptMessage, decryptMessage } from '@/utils/encryption';

export type Message = {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  self_destruct_seconds?: number | null;
  attachments?: MessageAttachment[];
  encrypted_content?: string | null;
  sender_name?: string;
  sender_avatar?: string;
};

export type MessageAttachment = {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size?: number;
  message_id: string;
};

export const useMessages = (conversationId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages when the component mounts
  useEffect(() => {
    if (conversationId && user) {
      fetchMessages();
      subscribeToNewMessages();
    }
    
    return () => {
      unsubscribeFromMessages();
    };
  }, [conversationId, user]);

  // Subscribe to new messages
  const subscribeToNewMessages = () => {
    if (!conversationId || !user) return;

    const messagesChannel = supabase
      .channel('messages-channel')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          
          // Only add the message if it's not already in the list
          if (!messages.some(msg => msg.id === newMessage.id)) {
            enrichMessage(newMessage).then(enrichedMessage => {
              setMessages(prev => [enrichedMessage, ...prev].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              ));
            });
          }
        }
      )
      .subscribe();

    console.log('Subscribed to messages channel');
  };

  const unsubscribeFromMessages = () => {
    supabase.removeChannel(supabase.channel('messages-channel'));
    console.log('Unsubscribed from messages channel');
  };

  // Fetch messages for a conversation
  const fetchMessages = async () => {
    if (!conversationId || !user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          conversation_id,
          created_at,
          status,
          self_destruct_seconds,
          encrypted_content
        `)
        .eq('conversation_id', conversationId)
        .order('created_at');

      if (messagesError) {
        throw messagesError;
      }

      // Fetch attachments for these messages
      const messageIds = messagesData.map(msg => msg.id);
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds);

      if (attachmentsError) {
        console.error('Error fetching attachments:', attachmentsError);
      }

      // Get sender profiles for all messages
      const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', senderIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Enrich messages with attachments and sender info
      const enrichedMessages = await Promise.all(messagesData.map(async (message) => {
        // Add attachments to the message
        const messageAttachments = attachmentsData?.filter(att => att.message_id === message.id) || [];
        
        // Add sender info
        const senderProfile = profilesData?.find(profile => profile.id === message.sender_id);
        
        // If message is encrypted, try to decrypt it
        let decryptedContent = message.content;
        if (message.encrypted_content && !message.content) {
          try {
            // In a real app, you'd need to get the sender's public key
            // For now, we'll just use the encrypted content as-is
            // decryptedContent = await decryptMessage(message.encrypted_content, senderPublicKey, user.id);
            decryptedContent = "This message is encrypted."; // Placeholder
          } catch (err) {
            console.error('Error decrypting message:', err);
            decryptedContent = "Unable to decrypt message.";
          }
        }

        return {
          ...message,
          content: decryptedContent,
          attachments: messageAttachments,
          sender_name: senderProfile?.name || 'Unknown',
          sender_avatar: senderProfile?.avatar_url
        };
      }));

      setMessages(enrichedMessages);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
      
      toast({
        title: "Error loading messages",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enrich a single message with attachments and sender info
  const enrichMessage = async (message: Message): Promise<Message> => {
    try {
      // Fetch attachments for this message
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('message_id', message.id);

      if (attachmentsError) {
        console.error('Error fetching attachments:', attachmentsError);
      }

      // Get sender profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', message.sender_id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching profile:', profileError);
      }

      // If message is encrypted, try to decrypt it
      let decryptedContent = message.content;
      if (message.encrypted_content && !message.content) {
        try {
          // In a real app, you'd need to get the sender's public key
          // For now, we'll just use the encrypted content as-is
          // decryptedContent = await decryptMessage(message.encrypted_content, senderPublicKey, user.id);
          decryptedContent = "This message is encrypted."; // Placeholder
        } catch (err) {
          console.error('Error decrypting message:', err);
          decryptedContent = "Unable to decrypt message.";
        }
      }

      return {
        ...message,
        content: decryptedContent,
        attachments: attachmentsData || [],
        sender_name: profileData?.name || 'Unknown',
        sender_avatar: profileData?.avatar_url
      };
    } catch (err) {
      console.error('Error enriching message:', err);
      return message;
    }
  };

  // Send a new message
  const sendMessage = async (content: string, selfDestruct?: number, attachments?: File[]) => {
    if (!conversationId || !user) return null;

    try {
      // Generate a new UUID for the message
      const messageId = uuidv4();
      
      // Prepare message data
      const messageData = {
        id: messageId,
        content,
        sender_id: user.id,
        conversation_id: conversationId,
        status: 'sent' as const,
        self_destruct_seconds: selfDestruct
      };
      
      // If encryption is enabled, encrypt the message
      if (false) { // Placeholder - in a real app, check if encryption is enabled
        try {
          // const recipientPublicKey = "..."; // Get recipient's public key
          // const encryptedContent = await encryptMessage(content, recipientPublicKey, user.id);
          // messageData.encrypted_content = encryptedContent;
          // messageData.content = null; // Don't store plaintext
        } catch (err) {
          console.error('Error encrypting message:', err);
          // If encryption fails, send as plaintext
        }
      }
      
      // Insert the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

      if (messageError) {
        throw messageError;
      }
      
      // Handle attachments if any
      if (attachments && attachments.length > 0) {
        await Promise.all(attachments.map(async (file) => {
          // Upload file to storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${messageId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { error: uploadError, data } = await supabase
            .storage
            .from('attachments')
            .upload(filePath, file);
            
          if (uploadError) {
            throw uploadError;
          }
          
          const { data: { publicUrl } } = supabase
            .storage
            .from('attachments')
            .getPublicUrl(filePath);
            
          // Create attachment record
          const { error: attachmentError } = await supabase
            .from('message_attachments')
            .insert({
              message_id: messageId,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_url: publicUrl
            });
            
          if (attachmentError) {
            throw attachmentError;
          }
        }));
      }
      
      // Mark the conversation as updated
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
        
      // Update the sender's last_read_at in conversation_participants
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
      
      return messageId;
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      toast({
        title: "Error sending message",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      return null;
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!conversationId || !user) return;

    try {
      // Update all messages in this conversation not sent by the user
      await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('status', 'delivered');
        
      // Update the user's last_read_at in conversation_participants
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      // First get the message to check permissions
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('sender_id, attachments:message_attachments(*)')
        .eq('id', messageId)
        .single();

      if (messageError) {
        throw messageError;
      }

      // Check if the user is the sender of the message
      if (message.sender_id !== user.id) {
        throw new Error('You can only delete your own messages');
      }

      // Delete attachments from storage if any
      if (message.attachments && message.attachments.length > 0) {
        const fileNames = message.attachments.map((att: any) => {
          // Extract filename from URL
          const url = new URL(att.file_url);
          const pathParts = url.pathname.split('/');
          return pathParts[pathParts.length - 1];
        });

        if (fileNames.length > 0) {
          const { error: storageError } = await supabase
            .storage
            .from('attachments')
            .remove(fileNames);

          if (storageError) {
            console.error('Error deleting attachment files:', storageError);
          }
        }
      }

      // Delete the message
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setMessages(messages.filter(msg => msg.id !== messageId));

      toast({
        title: "Message deleted",
        description: "The message has been permanently deleted.",
      });
    } catch (err: any) {
      console.error('Error deleting message:', err);
      
      toast({
        title: "Error deleting message",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    markMessagesAsRead,
    deleteMessage,
    refreshMessages: fetchMessages
  };
};
