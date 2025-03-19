
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { encryptMessage, decryptMessage, getUserKeyPair } from '@/utils/encryption';

export type Conversation = {
  id: string;
  name?: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  participants: Participant[];
  unread_count: number;
};

export type Participant = {
  user_id: string;
  name?: string;
  avatar_url?: string;
  status?: string;
  last_read_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  encrypted_content?: string;
  self_destruct_seconds?: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_avatar?: string;
  attachments?: Attachment[];
};

export type Attachment = {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  file_url: string;
  created_at: string;
};

export const useConversations = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToConversations();
    }
    
    return () => {
      unsubscribeFromAll();
    };
  }, [user]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      markConversationAsRead(activeConversation.id);
      subscribeToMessages(activeConversation.id);
    }
    
    return () => {
      if (activeConversation) {
        unsubscribeFromMessages();
      }
    };
  }, [activeConversation?.id]);

  // Subscribe to new conversations and conversation updates
  const subscribeToConversations = () => {
    if (!user) return;

    const conversationsChannel = supabase
      .channel('conversation-changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `id=in.(select conversation_id from conversation_participants where user_id='${user.id}')`
        }, 
        (payload) => {
          console.log('Conversation change received:', payload);
          fetchConversations();
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Conversation participant change received:', payload);
          fetchConversations();
        }
      )
      .subscribe();

    console.log('Subscribed to conversation changes');
  };

  // Subscribe to messages in the active conversation
  const subscribeToMessages = (conversationId: string) => {
    if (!user) return;

    const messagesChannel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        async (payload) => {
          console.log('Message change received:', payload);
          if (payload.eventType === 'INSERT') {
            // Add the new message to the existing messages
            const newMessage = payload.new as Message;
            
            // Fetch the sender profile and attachments
            const enrichedMessage = await enrichMessage(newMessage);
            
            // If it's a message from someone else, mark it as read
            if (newMessage.sender_id !== user.id) {
              markConversationAsRead(conversationId);
              
              // Try to decrypt the message if it's encrypted
              if (enrichedMessage.encrypted_content && !enrichedMessage.content) {
                await decryptMessageForDisplay(enrichedMessage);
              }
            }
            
            setMessages(prev => [...prev, enrichedMessage]);
          } else if (payload.eventType === 'UPDATE') {
            // Update the message in the existing messages
            const updatedMessage = payload.new as Message;
            setMessages(prev => 
              prev.map(msg => msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg)
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove the message from the existing messages
            const deletedMessageId = payload.old.id;
            setMessages(prev => prev.filter(msg => msg.id !== deletedMessageId));
          }
        }
      )
      .subscribe();

    console.log(`Subscribed to messages in conversation ${conversationId}`);
  };

  const unsubscribeFromMessages = () => {
    if (!activeConversation) return;
    
    supabase.removeChannel(supabase.channel(`messages-${activeConversation.id}`));
    console.log(`Unsubscribed from messages in conversation ${activeConversation.id}`);
  };

  const unsubscribeFromAll = () => {
    supabase.removeChannel(supabase.channel('conversation-changes'));
    if (activeConversation) {
      unsubscribeFromMessages();
    }
    console.log('Unsubscribed from all channels');
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setIsLoadingConversations(true);
      
      // Get all conversations the user is part of
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          last_read_at,
          conversations:conversation_id (
            id,
            name,
            is_group,
            created_at,
            updated_at,
            created_by
          )
        `)
        .eq('user_id', user.id);

      if (participantError) {
        throw participantError;
      }

      if (!participantData.length) {
        setConversations([]);
        setIsLoadingConversations(false);
        return;
      }

      // Get the conversation IDs
      const conversationIds = participantData.map(p => p.conversation_id);
      
      // Get the last message for each conversation
      const { data: lastMessagesData, error: lastMessagesError } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          encrypted_content,
          status,
          created_at
        `)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastMessagesError) {
        throw lastMessagesError;
      }

      // Get participants for each conversation
      const { data: allParticipantsData, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          last_read_at,
          profiles:user_id (
            name,
            avatar_url,
            status
          )
        `)
        .in('conversation_id', conversationIds);

      if (allParticipantsError) {
        throw allParticipantsError;
      }

      // Count unread messages for each conversation
      const { data: unreadCountsData, error: unreadCountsError } = await supabase
        .from('messages')
        .select('conversation_id, count', { count: 'exact' })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .gt('created_at', participantData[0].last_read_at)
        .groupBy('conversation_id');

      if (unreadCountsError) {
        throw unreadCountsError;
      }

      // Build the conversations array
      const enrichedConversations: Conversation[] = participantData.map(participant => {
        const conversation = participant.conversations;
        const participantsForConversation = allParticipantsData.filter(
          p => p.conversation_id === conversation.id
        );
        
        // Get the other participant for direct conversations, or all participants for group chats
        const participants: Participant[] = participantsForConversation.map(p => ({
          user_id: p.user_id,
          name: p.profiles?.name,
          avatar_url: p.profiles?.avatar_url,
          status: p.profiles?.status,
          last_read_at: p.last_read_at
        }));

        // Find the last message for this conversation
        const lastMessage = lastMessagesData?.find(m => m.conversation_id === conversation.id);
        
        // Find unread count for this conversation
        const unreadCount = unreadCountsData?.find(
          u => u.conversation_id === conversation.id
        )?.count || 0;

        // For direct chats, use the other person's name as conversation name if not set
        let conversationName = conversation.name;
        if (!conversation.is_group && !conversationName) {
          const otherParticipant = participants.find(p => p.user_id !== user.id);
          if (otherParticipant) {
            conversationName = otherParticipant.name;
          }
        }

        return {
          id: conversation.id,
          name: conversationName,
          is_group: conversation.is_group,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          last_message: lastMessage,
          participants,
          unread_count: parseInt(unreadCount as unknown as string, 10) || 0
        };
      });

      // Sort conversations by last message date
      enrichedConversations.sort((a, b) => {
        const dateA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.updated_at).getTime();
        const dateB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.updated_at).getTime();
        return dateB - dateA;
      });

      setConversations(enrichedConversations);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error loading conversations",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;

    try {
      setIsLoadingMessages(true);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          encrypted_content,
          self_destruct_seconds,
          status,
          created_at,
          updated_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Enrich messages with sender information and attachments
      const enrichedMessages: Message[] = await Promise.all(
        data.map(async (message) => await enrichMessage(message))
      );

      // Try to decrypt any encrypted messages
      for (const message of enrichedMessages) {
        if (message.encrypted_content && !message.content) {
          await decryptMessageForDisplay(message);
        }
      }

      setMessages(enrichedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error loading messages",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const enrichMessage = async (message: Message): Promise<Message> => {
    try {
      // Get the sender profile
      const { data: senderData, error: senderError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', message.sender_id)
        .single();

      if (senderError) {
        console.error('Error fetching sender profile:', senderError);
      }

      // Get attachments for this message
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('message_id', message.id);

      if (attachmentsError) {
        console.error('Error fetching message attachments:', attachmentsError);
      }

      return {
        ...message,
        sender_name: senderData?.name,
        sender_avatar: senderData?.avatar_url,
        attachments: attachmentsData || []
      };
    } catch (error) {
      console.error('Error enriching message:', error);
      return message;
    }
  };

  const decryptMessageForDisplay = async (message: Message) => {
    if (!user || !message.encrypted_content || !message.sender_id) return message;

    try {
      // Get the sender's public key
      const { data: senderKeyData, error: senderKeyError } = await supabase
        .from('encryption_keys')
        .select('public_key')
        .eq('user_id', message.sender_id)
        .single();

      if (senderKeyError) {
        console.error('Error fetching sender public key:', senderKeyError);
        return message;
      }

      // Decrypt the message
      const decryptedContent = await decryptMessage(
        message.encrypted_content,
        senderKeyData.public_key,
        user.id
      );

      if (decryptedContent) {
        // Update the message with the decrypted content
        message.content = decryptedContent;
        
        // Also update it in the messages state
        setMessages(prev => 
          prev.map(msg => msg.id === message.id ? { ...msg, content: decryptedContent } : msg)
        );
      }

      return message;
    } catch (error) {
      console.error('Error decrypting message:', error);
      return message;
    }
  };

  const startConversation = async (participantIds: string[], name?: string, isGroup = false) => {
    if (!user) return null;

    try {
      // Make sure the current user is included in the participants
      if (!participantIds.includes(user.id)) {
        participantIds.push(user.id);
      }

      // For direct conversations, check if one already exists
      if (!isGroup && participantIds.length === 2) {
        const otherUserId = participantIds.find(id => id !== user.id) as string;
        
        // Check if a direct conversation with this user already exists
        const { data: existingConvData, error: existingConvError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            conversations:conversation_id (
              id,
              is_group
            )
          `)
          .eq('user_id', user.id);

        if (existingConvError) {
          throw existingConvError;
        }

        const directConversations = existingConvData.filter(c => !c.conversations.is_group);
        
        for (const conv of directConversations) {
          // Check if the other user is also in this conversation
          const { data: otherParticipantData, error: otherParticipantError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.conversation_id)
            .eq('user_id', otherUserId);

          if (otherParticipantError) {
            console.error('Error checking other participant:', otherParticipantError);
            continue;
          }

          if (otherParticipantData.length > 0) {
            // Found an existing direct conversation with this user
            const conversation = conversations.find(c => c.id === conv.conversation_id);
            if (conversation) {
              setActiveConversation(conversation);
              return conversation;
            } else {
              await fetchConversations();
              return conv.conversation_id;
            }
          }
        }
      }

      // Create a new conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          created_by: user.id,
          is_group: isGroup,
          name: name || null
        })
        .select()
        .single();

      if (conversationError) {
        throw conversationError;
      }

      // Add participants
      const participants = participantIds.map(participantId => ({
        conversation_id: conversationData.id,
        user_id: participantId
      }));

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantsError) {
        throw participantsError;
      }

      // Refresh conversations and set the active one
      await fetchConversations();
      const newConversation = conversations.find(c => c.id === conversationData.id);
      if (newConversation) {
        setActiveConversation(newConversation);
      }

      return conversationData.id;
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error creating conversation",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  const sendMessage = async (
    conversationId: string, 
    content: string, 
    selfDestructSeconds?: number
  ) => {
    if (!user || !profile) return null;

    try {
      // Determine if we need to encrypt this message
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      let encryptedContent: string | null = null;
      let messageContent = content;

      // For direct conversations with encryption enabled
      if (!conversation.is_group) {
        const otherParticipant = conversation.participants.find(p => p.user_id !== user.id);
        if (otherParticipant) {
          // Check if the contact has encryption enabled
          const { data: contactData, error: contactError } = await supabase
            .from('contacts')
            .select('is_encrypted')
            .eq('user_id', user.id)
            .eq('contact_id', otherParticipant.user_id)
            .single();

          if (contactError && contactError.code !== 'PGRST116') {
            console.error('Error checking encryption status:', contactError);
          }

          // If encryption is enabled for this contact
          if (contactData?.is_encrypted) {
            // Get recipient's public key
            const { data: recipientKeyData, error: recipientKeyError } = await supabase
              .from('encryption_keys')
              .select('public_key')
              .eq('user_id', otherParticipant.user_id)
              .single();

            if (recipientKeyError) {
              if (recipientKeyError.code === 'PGRST116') {
                toast({
                  title: "Encryption unavailable",
                  description: "The recipient hasn't set up encryption keys yet. Message will be sent unencrypted.",
                  variant: "warning",
                });
              } else {
                console.error('Error fetching recipient public key:', recipientKeyError);
              }
            } else if (recipientKeyData) {
              // Encrypt the message
              encryptedContent = await encryptMessage(
                content,
                recipientKeyData.public_key,
                user.id
              );
              
              if (encryptedContent) {
                // If encryption succeeded, don't send plaintext
                messageContent = "";
              }
            }
          }
        }
      }

      // Create the message
      const messageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageContent,
        encrypted_content: encryptedContent,
        self_destruct_seconds: selfDestructSeconds,
        status: 'sent',
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
      
      // Update the local conversations state to reflect the read status
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 } 
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) {
        throw error;
      }

      // Remove the message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Message deleted",
        description: "Message has been permanently deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error deleting message",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const uploadAttachment = async (file: File, messageId: string) => {
    if (!user || !activeConversation) return null;

    try {
      // Create a folder path using the conversation ID
      const filePath = `${activeConversation.id}/${messageId}/${file.name}`;
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the file
      const { data: { publicUrl } } = supabase
        .storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Create an attachment record in the database
      const attachmentData = {
        message_id: messageId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: publicUrl
      };

      const { data, error } = await supabase
        .from('message_attachments')
        .insert(attachmentData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error uploading attachment:', error);
      toast({
        title: "Error uploading attachment",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    conversations,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    setActiveConversation,
    fetchConversations,
    fetchMessages,
    startConversation,
    sendMessage,
    markConversationAsRead,
    deleteMessage,
    uploadAttachment
  };
};
