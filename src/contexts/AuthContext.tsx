import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  adminLoading: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  console.log('AuthProvider initialized - single instance');

  const checkAdminStatus = async (userId: string) => {
    if (adminChecked || adminLoading) {
      console.log('Admin check skipped - already checked or loading:', { adminChecked, adminLoading });
      return;
    }
    
    setAdminLoading(true);
    console.log('Starting admin check for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      console.log('Admin check result:', { data, error });
      
      if (!error && data && data.length > 0) {
        console.log('User is admin - setting state');
        setIsAdmin(true);
      } else {
        console.log('User is not admin - setting state');
        setIsAdmin(false);
      }
      setAdminChecked(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setAdminChecked(true);
    } finally {
      setAdminLoading(false);
      console.log('Admin check completed');
    }
  };

  useEffect(() => {
    console.log('AuthProvider useEffect - setting up auth listener');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, !!session?.user);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Reset admin state when user changes
        setAdminChecked(false);
        setIsAdmin(false);
        setAdminLoading(false);
        
        // Check admin status when user changes
        if (session?.user && event !== 'SIGNED_OUT') {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 100);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', !!session?.user);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 100);
      }
    });

    return () => {
      console.log('AuthProvider cleanup - unsubscribing');
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to prevent loops

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    adminLoading,
    isAdmin,
    signUp,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};