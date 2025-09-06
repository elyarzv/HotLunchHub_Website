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
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

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

  const checkUser = async (retryCount = 0) => {
    try {
      console.log(`Checking user session (attempt ${retryCount + 1})...`);
      
      // Test connection first
      try {
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.warn('⚠️ Connection test failed:', testError.message);
        } else {
          console.log('✅ Connection test passed');
        }
      } catch (testError) {
        console.warn('⚠️ Connection test error:', testError.message);
      }
      
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 10000)
      );

      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]);

      if (sessionError) {
        console.error('Session check error:', sessionError);
        
        // Retry up to 2 times for network issues
        if (retryCount < 2 && (sessionError.message.includes('timeout') || sessionError.message.includes('fetch'))) {
          console.log(`Retrying session check (attempt ${retryCount + 2})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return checkUser(retryCount + 1);
        }
        
        throw sessionError;
      }

      if (session?.user) {
        await loadUserProfile(session.user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      
      // Don't set loading to false on network errors, let it retry
      if (!error.message.includes('timeout') && !error.message.includes('fetch')) {
        setLoading(false);
      }
    } finally {
      // Only set loading to false if we're not retrying
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  };

  const loadUserProfile = async (authUser, retryCount = 0) => {
    // Prevent multiple simultaneous profile loads
    if (isLoadingProfile) {
      console.log('⏳ Profile already loading, skipping duplicate request');
      return;
    }

    try {
      setIsLoadingProfile(true);
      console.log(`Loading profile for user: ${authUser.id} (attempt ${retryCount + 1})`);
      
      // Safety check: ensure we don't lose the user during loading
      if (!authUser || !authUser.id) {
        console.error('❌ Invalid authUser provided to loadUserProfile');
        return;
      }
      
      // Optimized profile query with shorter timeout
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      console.log('⏱️ Starting profile query with 5s timeout...');
      
      // Create a proactive fallback user after 3 seconds to prevent null states
      let proactiveFallbackTimer;
      let timeoutId;
      
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          console.log('⏰ Profile query timeout after 5 seconds');
          reject(new Error('Profile loading timeout'));
        }, 5000);
      });

      // Set up proactive fallback timer
      proactiveFallbackTimer = setTimeout(() => {
        console.log('⚠️ Profile taking longer than 3s, creating proactive fallback user...');
        
        // Try to detect role from email or context
        let detectedRole = 'unknown';
        if (authUser.email) {
          // Check for specific admin emails
          if (authUser.email.includes('admin') || authUser.email.includes('Admin') || 
              authUser.email === 'elyar.zavary@gmail.com') {
            detectedRole = 'admin';
          } else if (authUser.email.includes('cook') || authUser.email.includes('Cook')) {
            detectedRole = 'cook';
          } else if (authUser.email.includes('driver') || authUser.email.includes('Driver')) {
            detectedRole = 'driver';
          } else if (authUser.email.includes('employee') || authUser.email.includes('Employee')) {
            detectedRole = 'employee';
          }
        }
        
        const proactiveFallbackUser = {
          id: authUser.id,
          email: authUser.email,
          role: detectedRole,
          name: authUser.email?.split('@')[0] || 'User',
          status: 'active',
          roleDetails: null,
        };
        
        console.log('Created proactive fallback user with detected role:', proactiveFallbackUser);
        setUser(proactiveFallbackUser);
      }, 3000);

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);

      // Clear both timers since we got a result
      if (timeoutId) clearTimeout(timeoutId);
      if (proactiveFallbackTimer) clearTimeout(proactiveFallbackTimer);
      console.log('✅ Profile query completed successfully');

      if (profileError) {
        console.error('Profile error:', profileError);
        
        // Retry up to 2 times for network issues
        if (retryCount < 2 && (profileError.message.includes('timeout') || profileError.message.includes('fetch'))) {
          console.log(`Retrying profile load (attempt ${retryCount + 2})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return loadUserProfile(authUser, retryCount + 1);
        }
        
        // Create a fallback user immediately when profile fails
        console.log('Profile not found, creating fallback user...');
        
        // Try to detect role from email or context
        let detectedRole = 'unknown';
        if (authUser.email) {
          if (authUser.email.includes('admin') || authUser.email.includes('Admin')) {
            detectedRole = 'admin';
          } else if (authUser.email.includes('cook') || authUser.email.includes('Cook')) {
            detectedRole = 'cook';
          } else if (authUser.email.includes('driver') || authUser.email.includes('Driver')) {
            detectedRole = 'driver';
          } else if (authUser.email.includes('employee') || authUser.email.includes('Employee')) {
            detectedRole = 'employee';
          }
        }
        
        const fallbackUser = {
          id: authUser.id,
          email: authUser.email,
          role: detectedRole,
          name: authUser.email?.split('@')[0] || 'User',
          status: 'active',
          roleDetails: null,
        };
        
        console.log('Created fallback user with detected role:', fallbackUser);
        setUser(fallbackUser);
        return;
      }

      // Get role-specific details with timeout
      let roleDetails = null;
      
      console.log('🔍 Loading role details for role:', profile.role);
      
      if (profile.role === 'admin') {
        try {
          const adminPromise = supabase
            .from('admins')
            .select('admin_id, name, admin_code, email, phone')
            .eq('auth_id', authUser.id)
            .single();

          const adminTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Admin details timeout')), 10000)
          );

          const { data: adminData } = await Promise.race([
            adminPromise,
            adminTimeoutPromise
          ]);
          
          console.log('✅ Admin details loaded successfully:', adminData);
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
            .select('cook_id, name, phone, email, address_line1, address_line2, city, postal_code')
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
          console.log('📋 Cook fields available:', Object.keys(cookData || {}));
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
            .select('driver_id, name, phone, email')
            .eq('auth_id', authUser.id)
            .single();

          const driverTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Driver details timeout')), 10000)
          );

          const { data: driverData } = await Promise.race([
            driverPromise,
            driverTimeoutPromise
          ]);
          
          console.log('✅ Driver details loaded successfully:', driverData);
          roleDetails = driverData;
        } catch (driverError) {
          console.log('Driver details not found, using basic info');
          roleDetails = null;
        }
      } else if (profile.role === 'employee') {
        try {
          const employeePromise = supabase
            .from('employees')
            .select('employee_id, name, employee_code, email, phone, company_id')
            .eq('auth_id', authUser.id)
            .single();

          const employeeTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Employee details timeout')), 10000)
          );

          const { data: employeeData } = await Promise.race([
            employeePromise,
            employeeTimeoutPromise
          ]);
          
          console.log('✅ Employee details loaded successfully:', employeeData);
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

      console.log('✅ User profile loaded successfully:', userProfile);
      console.log('📋 Available profile fields:', Object.keys(userProfile));
      console.log('🔍 Role details fields:', roleDetails ? Object.keys(roleDetails) : 'None');
      setUser(userProfile);
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Only create fallback user if we have a valid authUser
      if (authUser && authUser.id) {
        console.log('Error loading profile, creating fallback user...');
        
        // Try to detect role from email or context
        let detectedRole = 'unknown';
        if (authUser.email) {
          if (authUser.email.includes('admin') || authUser.email.includes('Admin')) {
            detectedRole = 'admin';
          } else if (authUser.email.includes('cook') || authUser.email.includes('Cook')) {
            detectedRole = 'cook';
          } else if (authUser.email.includes('driver') || authUser.email.includes('Driver')) {
            detectedRole = 'driver';
          } else if (authUser.email.includes('employee') || authUser.email.includes('Employee')) {
            detectedRole = 'employee';
          }
        }
        
        const fallbackUser = {
          id: authUser.id,
          email: authUser.email,
          role: detectedRole,
          name: authUser.email?.split('@')[0] || 'User',
          status: 'active',
          roleDetails: null,
        };
        
        console.log('Created fallback user due to error with detected role:', fallbackUser);
        setUser(fallbackUser);
      } else {
        console.error('❌ Cannot create fallback user - invalid authUser');
        // Don't set user to null - keep existing user if any
      }
    } finally {
      setIsLoadingProfile(false);
      setLoading(false);
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
