import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({
  user: null,
  loading: true,
  signOut: async () => {},
  loadUserProfile: async () => {},
});

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log('🔧 AuthProvider initializing...');
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
        // Don't create fallback user - let the login screen handle the error
        console.log('Profile not found, keeping user as null');
        setUser(null);
        return;
      }

      // Get role-specific details with timeout
      let roleDetails = null;
      
      console.log('🔍 Loading role details for role:', profile.role);
      
      if (profile.role === 'admin') {
        try {
          const adminPromise = supabase
            .from('admins')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();

          const adminTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Admin details timeout')), 10000)
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
      } else if (profile.role === 'cook') {
        try {
          console.log('🔍 Loading cook details for auth_id:', authUser.id);
          
          const cookPromise = supabase
            .from('cooks')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();

          const cookTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cook details timeout')), 10000)
          );

          const { data: cookData, error: cookError } = await Promise.race([
            cookPromise,
            cookTimeoutPromise
          ]);
          
          if (cookError) {
            console.error('❌ Cook details error:', cookError);
            throw cookError;
          }
          
          console.log('✅ Cook details loaded successfully:', cookData);
          roleDetails = cookData;
        } catch (cookError) {
          console.error('❌ Cook details failed:', cookError);
          console.log('Cook details not found, using basic info');
          roleDetails = null;
        }
      } else if (profile.role === 'driver') {
        try {
          const driverPromise = supabase
            .from('drivers')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();

          const driverTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Driver details timeout')), 10000)
          );

          const { data: driverData } = await Promise.race([
            driverPromise,
            driverTimeoutPromise
          ]);
          
          roleDetails = driverData;
        } catch (driverError) {
          console.log('Driver details not found, using basic info');
          roleDetails = null;
        }
      } else if (profile.role === 'employee') {
        try {
          const employeePromise = supabase
            .from('employees')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();

          const employeeTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Employee details timeout')), 10000)
          );

          const { data: employeeData } = await Promise.race([
            employeePromise,
            employeeTimeoutPromise
          ]);
          
          roleDetails = employeeData;
        } catch (employeeError) {
          console.log('Employee details not found, using basic info');
          roleDetails = null;
        }
      }

      const userProfile = {
        id: authUser.id,
        email: authUser.email,
        role: profile.role,
        name: roleDetails?.name || profile.full_name || authUser.email?.split('@')[0] || 'User',
        status: profile.status || 'active',
        roleDetails,
      };

      console.log('User profile loaded successfully:', userProfile);
      setUser(userProfile);
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Don't create fallback user - let the login screen handle the error
      console.log('Error loading profile, keeping user as null');
      setUser(null);
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
    loadUserProfile,
  };

  console.log('🔧 AuthContext value updated:', { user: !!user, loading, hasSignOut: !!signOut, hasLoadProfile: !!loadUserProfile });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
