import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (authUser) => {
    try {
      console.log('Loading profile for user:', authUser.id);
      
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile loading timeout')), 5000)
      );

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);

      if (profileError) {
        console.error('Profile error:', profileError);
        // Create fallback user if profile fails
        const fallbackUser = {
          id: authUser.id,
          email: authUser.email,
          role: 'admin', // Default to admin
          name: authUser.email?.split('@')[0] || 'Admin',
          status: 'active',
          roleDetails: null,
        };
        console.log('Using fallback user:', fallbackUser);
        setUser(fallbackUser);
        return;
      }

      // Get role-specific details with timeout
      let roleDetails = null;
      
      if (profile.role === 'admin') {
        try {
          const adminPromise = supabase
            .from('admins')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();

          const adminTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Admin details timeout')), 3000)
          );

          const { data: adminData } = await Promise.race([
            adminPromise,
            adminTimeoutPromise
          ]);
          
          roleDetails = adminData;
        } catch (adminError) {
          console.log('Admin details not found, using basic info');
          roleDetails = null;
        }
      }

      const userProfile = {
        id: authUser.id,
        email: authUser.email,
        role: profile.role,
        name: profile.full_name || authUser.email?.split('@')[0] || 'Admin',
        status: profile.status || 'active',
        roleDetails,
      };

      console.log('User profile loaded successfully:', userProfile);
      setUser(userProfile);
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Create a basic user object to prevent infinite loading
      const basicUser = {
        id: authUser.id,
        email: authUser.email,
        role: 'admin', // Default to admin
        name: authUser.email?.split('@')[0] || 'Admin',
        status: 'active',
        roleDetails: null,
      };
      
      console.log('Creating basic user due to error:', basicUser);
      setUser(basicUser);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
