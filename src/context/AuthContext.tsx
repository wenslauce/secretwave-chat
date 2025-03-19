
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import sodium from 'libsodium-wrappers';

type Profile = {
  id: string;
  name: string;
  avatar_url?: string;
  status?: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  generateEncryptionKeys: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Load user data on auth state change
  useEffect(() => {
    // Initialize sodium
    sodium.ready.then(() => {
      console.log('Sodium initialized');
    });

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Authentication error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        toast({
          title: "Account created",
          description: "Your account has been successfully created. You can now log in.",
        });
        
        // Generate encryption keys for the new user
        await generateEncryptionKeys();
        
        navigate('/');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Registration error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast({
        title: "Profile update error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const generateEncryptionKeys = async () => {
    if (!user) return;

    try {
      await sodium.ready;
      
      // Generate a new key pair
      const keyPair = sodium.crypto_box_keypair();
      const publicKey = sodium.to_base64(keyPair.publicKey);
      
      // Store the keypair in localStorage for this session
      // In a production app, you might want to encrypt the private key with the user's password
      localStorage.setItem(`encryption_keypair_${user.id}`, JSON.stringify({
        publicKey: sodium.to_base64(keyPair.publicKey),
        privateKey: sodium.to_base64(keyPair.privateKey)
      }));
      
      // Store the public key in the database
      const { error } = await supabase
        .from('encryption_keys')
        .upsert({ 
          user_id: user.id, 
          public_key: publicKey,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        throw error;
      }
      
      console.log('Encryption keys generated and stored successfully');
    } catch (error: any) {
      console.error('Generate encryption keys error:', error);
      toast({
        title: "Encryption key generation error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        generateEncryptionKeys
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
