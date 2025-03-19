
import { supabase } from '@/integrations/supabase/client';

// User status type
export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

// User presence type
export type UserPresence = {
  user_id: string;
  status: UserStatus;
  last_seen: string;
};

let presenceChannel: any = null;

// Initialize presence tracking for a user
export const initPresence = (userId: string) => {
  if (!userId) return;
  
  // Remove any existing channel
  if (presenceChannel) {
    supabase.removeChannel(presenceChannel);
  }
  
  // Create a new presence channel
  presenceChannel = supabase.channel('online-users');
  
  // Set up presence state tracking
  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      // This is called whenever presence state changes
      const state = presenceChannel.presenceState();
      console.log('Presence state updated:', state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
      console.log('User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
      console.log('User left:', key, leftPresences);
    })
    .subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        // Add the user to presence tracking with 'online' status
        updateUserStatus(userId, 'online');
      }
    });
  
  // Set up event listeners for page visibility and unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      updateUserStatus(userId, 'away');
    } else {
      updateUserStatus(userId, 'online');
    }
  });
  
  window.addEventListener('beforeunload', () => {
    updateUserStatus(userId, 'offline');
  });
  
  console.log('Presence tracking initialized for user:', userId);
};

// Update the user's status in real-time
export const updateUserStatus = async (userId: string, status: UserStatus) => {
  if (!userId || !presenceChannel) return;
  
  try {
    // Track presence state in the channel
    await presenceChannel.track({
      user_id: userId,
      status,
      last_seen: new Date().toISOString()
    });
    
    // Also update the profile status in the database
    await supabase
      .from('profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    console.log('User status updated:', status);
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

// Clean up presence tracking
export const cleanupPresence = () => {
  if (presenceChannel) {
    supabase.removeChannel(presenceChannel);
    presenceChannel = null;
    console.log('Presence tracking cleaned up');
  }
};
