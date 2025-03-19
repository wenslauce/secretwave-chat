import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export type Conversation = {
  id: string;
  name?: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  last_message?: string;
  unread_count: number;
  participants: ConversationParticipant[];
};

export type ConversationParticipant = {
  user_id: string;
  name: string;
  avatar_url?: string;
  last_read_at: string;
  status?: string;
};

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToConversationUpdates();
    }
    
    return () => {
      unsubscribeFromConversations();
    };
  }, [user]);

  const subscribeToConversationUpdates = () => {
    if (!user) return;

    const messageChannel = supabase
      .channel('messages-updates')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${conversations.map(c => `"${c.id}"`).join(',')})`
        }, 
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    const participantChannel = supabase
      .channel('participant-updates')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants'
        }, 
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    console.log('Subscribed to conversation updates');
  };

  const unsubscribeFromConversations = () => {
    supabase.removeChannel(supabase.channel('messages-updates'));
    supabase.removeChannel(supabase.channel('participant-updates'));
    console.log('Unsubscribed from conversation updates');
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (participantError) {
        throw participantError;
      }

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);
      
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        throw conversationsError;
      }

      const { data: allParticipantsData, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          last_read_at,
          profiles:user_id(
            name,
            avatar_url,
            status
          )
        `)
        .in('conversation_id', conversationIds);

      if (allParticipantsError) {
        throw allParticipantsError;
      }

      const lastMessages: Record<string, { content: string, created_at: string }> = {};
      const unreadCounts: Record<string, number> = {};
      
      await Promise.all(conversationIds.map(async (convId) => {
        const userParticipant = participantData.find(p => p.conversation_id === convId);
        const lastReadAt = userParticipant?.last_read_at || new Date(0).toISOString();
        
        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!lastMessageError && lastMessageData) {
          lastMessages[convId] = lastMessageData;
        }
        
        const { count, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', convId)
          .neq('sender_id', user.id)
          .gt('created_at', lastReadAt);
          
        if (!countError) {
          unreadCounts[convId] = count || 0;
        }
      }));

      const enrichedConversations = conversationsData.map(conversation => {
        const participants = allParticipantsData
          .filter(p => p.conversation_id === conversation.id)
          .map(p => ({
            user_id: p.user_id,
            name: p.profiles?.name || 'Unknown',
            avatar_url: p.profiles?.avatar_url,
            last_read_at: p.last_read_at,
            status: p.profiles?.status
          }));
          
        let displayName = conversation.name;
        if (!conversation.is_group) {
          const otherParticipant = participants.find(p => p.user_id !== user.id);
          if (otherParticipant) {
            displayName = otherParticipant.name;
          }
        }
        
        return {
          ...conversation,
          name: displayName,
          participants,
          last_message: lastMessages[conversation.id]?.content,
          unread_count: unreadCounts[conversation.id] || 0
        };
      });

      setConversations(enrichedConversations);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations');
      
      toast({
        title: "Error loading conversations",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (participantIds: string[], name?: string) => {
    if (!user) return null;

    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .in('id', participantIds);

      if (userError) {
        throw userError;
      }

      if (userData.length !== participantIds.length) {
        throw new Error('One or more participants are not valid users');
      }

      if (participantIds.length === 1) {
        const otherUserId = participantIds[0];
        
        const { data: existingConv, error: existingError } = await supabase
          .rpc('find_or_create_direct_conversation', {
            user1_id: user.id,
            user2_id: otherUserId
          });
          
        if (!existingError && existingConv) {
          await fetchConversations();
          return existingConv;
        }
      }

      const conversationId = uuidv4();
      const { error: convError } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          name: name,
          is_group: participantIds.length > 1,
          created_by: user.id
        });

      if (convError) {
        throw convError;
      }

      const allParticipants = [...participantIds, user.id];
      const participantsData = allParticipants.map(userId => ({
        conversation_id: conversationId,
        user_id: userId
      }));

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participantsData);

      if (participantsError) {
        throw participantsError;
      }

      await fetchConversations();
      
      return conversationId;
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      
      toast({
        title: "Error creating conversation",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      return null;
    }
  };

  return {
    conversations,
    isLoading,
    error,
    createConversation,
    refreshConversations: fetchConversations
  };
};
