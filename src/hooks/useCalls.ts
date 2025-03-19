
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export type Call = {
  id: string;
  caller_id: string;
  recipient_id: string;
  status: 'missed' | 'answered' | 'rejected' | 'ended';
  call_type: 'audio' | 'video';
  started_at: string;
  ended_at?: string;
  duration?: number;
  caller_name?: string;
  caller_avatar?: string;
  recipient_name?: string;
  recipient_avatar?: string;
};

export const useCalls = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<Call | null>(null);

  useEffect(() => {
    if (user) {
      fetchCalls();
      subscribeToNewCalls();
    }

    return () => {
      unsubscribeFromNewCalls();
    };
  }, [user]);

  const subscribeToNewCalls = () => {
    if (!user) return;

    const callsChannel = supabase
      .channel('calls-channel')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `recipient_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('New call received:', payload);
          handleIncomingCall(payload.new as Call);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `caller_id=eq.${user.id}` // For calls we initiate
        },
        (payload) => {
          console.log('Call updated (caller):', payload);
          handleCallStatusChange(payload.new as Call);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `recipient_id=eq.${user.id}` // For calls we receive
        },
        (payload) => {
          console.log('Call updated (recipient):', payload);
          handleCallStatusChange(payload.new as Call);
        }
      )
      .subscribe();

    console.log('Subscribed to calls channel');
  };

  const unsubscribeFromNewCalls = () => {
    supabase.removeChannel(supabase.channel('calls-channel'));
    console.log('Unsubscribed from calls channel');
  };

  const handleIncomingCall = async (call: Call) => {
    // Enrich the call with caller information
    const enrichedCall = await enrichCall(call);
    
    // Add the call to the calls list
    setCalls(prev => [enrichedCall, ...prev]);
    
    // Set as active call if it's a new incoming call that's not already handled
    if (call.status !== 'missed' && call.status !== 'rejected' && call.status !== 'ended') {
      setActiveCall(enrichedCall);
      
      // Trigger system notification if the app is in background
      if (document.visibilityState === 'hidden' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Incoming Call', {
            body: `${enrichedCall.caller_name || 'Someone'} is calling you`,
            icon: enrichedCall.caller_avatar
          });
        }
      }
    }
  };

  const handleCallStatusChange = async (call: Call) => {
    // Update the call in the calls list
    setCalls(prev => 
      prev.map(c => c.id === call.id ? { ...c, ...call } : c)
    );
    
    // Update active call if this is the active call
    if (activeCall && activeCall.id === call.id) {
      const enrichedCall = await enrichCall(call);
      setActiveCall(enrichedCall);
      
      // If the call ended, clear the active call
      if (call.status === 'ended' || call.status === 'rejected' || call.status === 'missed') {
        setActiveCall(null);
      }
    }
  };

  const fetchCalls = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .or(`caller_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('started_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Enrich calls with caller and recipient information
      const enrichedCalls = await Promise.all(
        data.map(async (call) => await enrichCall(call))
      );

      setCalls(enrichedCalls);
    } catch (error: any) {
      console.error('Error fetching calls:', error);
      toast({
        title: "Error loading calls",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const enrichCall = async (call: Call): Promise<Call> => {
    try {
      // Get caller profile
      const { data: callerData, error: callerError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', call.caller_id)
        .single();

      if (callerError) {
        console.error('Error fetching caller profile:', callerError);
      }

      // Get recipient profile
      const { data: recipientData, error: recipientError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', call.recipient_id)
        .single();

      if (recipientError) {
        console.error('Error fetching recipient profile:', recipientError);
      }

      return {
        ...call,
        caller_name: callerData?.name,
        caller_avatar: callerData?.avatar_url,
        recipient_name: recipientData?.name,
        recipient_avatar: recipientData?.avatar_url
      };
    } catch (error) {
      console.error('Error enriching call:', error);
      return call;
    }
  };

  const initiateCall = async (recipientId: string, callType: 'audio' | 'video') => {
    if (!user) return null;

    try {
      // Create a new call record
      const { data, error } = await supabase
        .from('calls')
        .insert({
          caller_id: user.id,
          recipient_id: recipientId,
          status: 'missed', // Initial status
          call_type: callType,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Enrich the call with caller and recipient information
      const enrichedCall = await enrichCall(data);
      
      // Add to calls list and set as active
      setCalls(prev => [enrichedCall, ...prev]);
      setActiveCall(enrichedCall);
      
      return enrichedCall;
    } catch (error: any) {
      console.error('Error initiating call:', error);
      toast({
        title: "Error initiating call",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  const answerCall = async (callId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calls')
        .update({ 
          status: 'answered'
        })
        .eq('id', callId)
        .eq('recipient_id', user.id);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error answering call:', error);
      toast({
        title: "Error answering call",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const rejectCall = async (callId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calls')
        .update({ 
          status: 'rejected',
          ended_at: new Date().toISOString()
        })
        .eq('id', callId);

      if (error) {
        throw error;
      }
      
      // Clear the active call
      if (activeCall && activeCall.id === callId) {
        setActiveCall(null);
      }
    } catch (error: any) {
      console.error('Error rejecting call:', error);
      toast({
        title: "Error rejecting call",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const endCall = async (callId: string) => {
    if (!user) return;

    try {
      // Get the call start time
      const call = calls.find(c => c.id === callId);
      if (!call) {
        throw new Error('Call not found');
      }

      // Calculate duration in seconds
      const startTime = new Date(call.started_at).getTime();
      const endTime = new Date().getTime();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      const { error } = await supabase
        .from('calls')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString(),
          duration: durationSeconds
        })
        .eq('id', callId);

      if (error) {
        throw error;
      }
      
      // Clear the active call
      if (activeCall && activeCall.id === callId) {
        setActiveCall(null);
      }
    } catch (error: any) {
      console.error('Error ending call:', error);
      toast({
        title: "Error ending call",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    calls,
    isLoading,
    activeCall,
    setActiveCall,
    fetchCalls,
    initiateCall,
    answerCall,
    rejectCall,
    endCall
  };
};
