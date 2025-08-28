// Configuration constants for the HotLunchHub app
export const CONFIG = {
  // Supabase configuration
  SUPABASE_URL: 'https://aeabhwgmqebozettfelh.supabase.co', // Local development URL
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlYWJod2dtcWVib3pldHRmZWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzQ3MzAsImV4cCI6MjA3MDk1MDczMH0.saWjpzwFmm-_VGcY_-qFnpldXbduu9Jxqjd7tWk0Gpc', // Replace with your actual anon key
  
  // App configuration
  APP_NAME: 'HotLunchHub',
  APP_VERSION: '1.0.0',
  
  // API endpoints
  API_BASE_URL: 'http://127.0.0.1:54321',
  
  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_PROFILE: 'user_profile',
    USER_ROLE: 'user_role',
    COMPANY_ID: 'company_id'
  },
  
  // Order statuses
  ORDER_STATUSES: {
    PENDING: 'pending',
    PREPARED: 'prepared',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },
  
  // User roles
  USER_ROLES: {
    EMPLOYEE: 'employee',
    COOK: 'cook',
    DRIVER: 'driver',
    ADMIN: 'admin'
  },
  
  // Plan types
  PLAN_TYPES: {
    WEEKLY: 'weekly',
    MONTHLY: 'monthly'
  }
};

// Supabase client configuration
export const SUPABASE_CONFIG = {
  url: CONFIG.SUPABASE_URL,
  anonKey: CONFIG.SUPABASE_ANON_KEY,
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
};
