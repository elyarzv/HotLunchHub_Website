// Supabase service for HotLunchHub app
// Handles authentication and database operations

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../constants/config';
import { CONFIG } from '../constants/config';

// Initialize Supabase client
export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  SUPABASE_CONFIG.auth
);

// Connection cache to avoid repeated slow connections
let connectionCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fast connection test function (only when actually needed)
export const testConnectionWhenNeeded = async () => {
  console.log('🔍 Testing connection when needed...');
  try {
    const result = await testDatabaseConnection();
    console.log('🔍 Connection test result:', result);
    return result;
  } catch (error) {
    console.log('🔍 Connection test failed:', error);
    return { connection: false, error: error.message };
  }
};

// Legacy pre-warm function (disabled for speed)
export const prewarmConnection = async () => {
  console.log('🚀 Pre-warming disabled for faster loading');
  return { connection: true, message: 'Pre-warming skipped for speed' };
};

// Test database connectivity with fast, non-blocking strategy
export const testDatabaseConnection = async () => {
  console.log('🧪 Testing database connection...');
  
  // Check cache first
  const now = Date.now();
  if (connectionCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('🧪 Using cached connection result (valid for 5 minutes)');
    return connectionCache;
  }
  
  try {
    // Fast test: Just check if we can access the profiles table (2 second timeout)
    console.log('🧪 Quick connection test (2s timeout)...');
    const { data, error } = await Promise.race([
      supabase
        .from('profiles')
        .select('id')
        .limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Quick test timeout')), 2000)
      )
    ]);
    
    const hasConnection = !error;
    console.log('🧪 Quick connection test result:', hasConnection ? '✅ Success' : '❌ Failed');
    
    const result = {
      connection: hasConnection,
      profilesTableExists: hasConnection,
      userCount: 0, // Skip count for speed
      authConnection: hasConnection, // Assume auth works if profiles accessible
      profileConnection: hasConnection,
      countConnection: hasConnection,
      errors: {
        auth: null,
        profile: error,
        count: null
      }
    };
    
    // Cache the result for 5 minutes
    connectionCache = result;
    cacheTimestamp = now;
    console.log('🧪 Connection result cached for 5 minutes');
    
    return result;
    
  } catch (error) {
    console.error('🧪 Database connection test failed:', error);
    return {
      connection: false,
      profilesTableExists: false,
      userCount: 0,
      authConnection: false,
      profileConnection: false,
      countConnection: false,
      errors: {
        auth: error.message,
        profile: error.message,
        count: error.message
      }
    };
  }
};

// Authentication service
export const authService = {
  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Get user profile after successful sign in
      if (data.user) {
        const profile = await this.getUserProfile(data.user.id);
        return { user: profile, session: data.session };
      }
      
      return { user: null, session: data.session };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Sign up with email and password
  async signUp(email, password, userData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData // Additional user metadata
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  // Get user profile based on role
  async getUserProfile(userId) {
    try {
      console.log('🔍 Looking up user profile for ID:', userId);
      
      // First check the profiles table for the user's role
      console.log('📋 Checking profiles table...');
      console.log('🔍 Querying profiles table with userId:', userId);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('📋 Profile lookup result:', { profile, profileError });
      console.log('📋 Profile data:', profile);
      console.log('📋 Profile error:', profileError);

      if (profileError || !profile) {
        console.log('❌ No profile found for user:', userId);
        return null;
      }

      // Now get additional details from the appropriate role table
      let roleDetails = null;
      let roleError = null;

      switch (profile.role) {
        case 'employee':
          console.log('👷 Getting employee details...');
          ({ data: roleDetails, error: roleError } = await supabase
            .from('employees')
            .select('*')
            .eq('auth_id', userId)
            .maybeSingle());
          break;
        
        case 'cook':
          console.log('👨‍🍳 Getting cook details...');
          ({ data: roleDetails, error: roleError } = await supabase
            .from('cooks')
            .select('*')
            .eq('auth_id', userId)
            .maybeSingle());
          break;
        
        case 'driver':
          console.log('🚚 Getting driver details...');
          ({ data: roleDetails, error: roleError } = await supabase
            .from('drivers')
            .select('*')
            .eq('auth_id', userId)
            .maybeSingle());
          break;
        
        case 'admin':
          console.log('👑 Getting admin details...');
          // For admin, check if there's an entry in admins table
          ({ data: roleDetails, error: roleError } = await supabase
            .from('admins')
            .select('*')
            .eq('auth_id', userId)
            .maybeSingle());
          break;
        
        default:
          console.log('❌ Unknown role:', profile.role);
          return null;
      }

      console.log('📋 Role details result:', { roleDetails, roleError });

      // Create the user profile object based on actual schema
      const userProfile = {
        id: userId,
        role: profile.role,
        name: profile.full_name, // profiles table has full_name
        email: roleDetails?.email || null, // email is in role-specific tables
        company_id: profile.role === 'employee' ? roleDetails?.company_id : null,
        code: profile.role === 'admin' ? roleDetails?.admin_code : 
              profile.role === 'employee' ? roleDetails?.employee_code : 
              profile.role === 'cook' ? roleDetails?.cook_code : 
              profile.role === 'driver' ? roleDetails?.driver_code : null,
        phone: roleDetails?.phone || null,
        created_at: profile.created_at,
        status: profile.status,
        roleDetails: roleDetails
      };

      // Log any role details errors (but don't fail the profile creation)
      if (roleError && profile.role !== 'admin') {
        console.log('⚠️ Warning: Could not fetch role details for', profile.role, ':', roleError);
        console.log('📋 Using profile data only');
      }

      console.log('✅ User profile created:', userProfile);
      return userProfile;

    } catch (error) {
      console.error('❌ Get user profile error:', error);
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database service for orders
export const orderService = {
  // Get orders for an employee
  async getEmployeeOrders(employeeId, companyId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          meals (*)
        `)
        .eq('employee_id', employeeId)
        .eq('company_id', companyId)
        .order('order_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get employee orders error:', error);
      throw error;
    }
  },

  // Get orders for a cook
  async getCookOrders(cookId, companyId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          meals (*),
          employees (name, employee_code)
        `)
        .eq('company_id', companyId)
        .eq('status', CONFIG.ORDER_STATUSES.PENDING)
        .order('order_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get cook orders error:', error);
      throw error;
    }
  },

  // Get deliveries for a driver
  async getDriverDeliveries(driverId, companyId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          meals (*),
          employees (name, employee_code)
        `)
        .eq('company_id', companyId)
        .eq('status', CONFIG.ORDER_STATUSES.PREPARED)
        .order('order_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get driver deliveries error:', error);
      throw error;
    }
  },

  // Create a new order
  async createOrder(orderData) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('order_id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  }
};

// Database service for meals
export const mealService = {
  // Get all meals
  async getMeals() {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get meals error:', error);
      throw error;
    }
  },

  // Get meals by company (if you want to restrict meals per company)
  async getMealsByCompany(companyId) {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get meals by company error:', error);
      throw error;
    }
  }
};

// Database service for companies
export const companyService = {
  // Get company details
  async getCompany(companyId) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get company error:', error);
      throw error;
    }
  }
};
