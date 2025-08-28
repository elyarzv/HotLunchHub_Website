// Create First Admin Utility
// Use this script to create the initial admin user for your system
// Run this once during initial setup

import { supabase } from '../services/supabase';

/**
 * Creates the first admin user for your system
 * This should only be run once during initial setup
 * 
 * @param {Object} adminData - Admin user data
 * @param {string} adminData.email - Admin email
 * @param {string} adminData.password - Admin password
 * @param {string} adminData.full_name - Admin full name
 * @param {string} adminData.company_id - Company ID (optional)
 * @returns {Promise<Object>} Result object
 */
export const createFirstAdmin = async (adminData) => {
  try {
    console.log('🚀 Creating first admin user...');
    
    // Validate input
    if (!adminData.email || !adminData.password || !adminData.full_name) {
      throw new Error('Email, password, and full name are required');
    }

    if (adminData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: adminData.full_name,
        role: 'admin',
        is_first_admin: true,
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw new Error(`Failed to create admin account: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log('✅ Auth user created:', userId);

    // 2. Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role: 'admin',
        full_name: adminData.full_name,
        status: 'active',
        // Store admin metadata
        admin_metadata: {
          admin_level: 'super_admin',
          permissions: {
            user_management: true,
            meal_management: true,
            order_management: true,
            system_settings: true,
            admin_management: true,
          },
          is_first_admin: true,
          created_at: new Date().toISOString(),
        },
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create admin profile: ${profileError.message}`);
    }

    console.log('✅ Admin profile created');

    // 3. Return success
    const result = {
      success: true,
      admin: {
        id: userId,
        email: adminData.email,
        full_name: adminData.full_name,
        role: 'admin',
        admin_level: 'super_admin',
        is_first_admin: true,
      },
      message: 'First admin user created successfully!',
    };

    console.log('🎉 First admin created successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ Error creating first admin:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create first admin user',
    };
  }
};

/**
 * Check if any admin users exist in the system
 * @returns {Promise<boolean>} True if admins exist, false otherwise
 */
export const checkIfAdminsExist = async () => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (error) {
      console.error('Error checking for admins:', error);
      return false;
    }

    return profiles && profiles.length > 0;
  } catch (error) {
    console.error('Error checking for admins:', error);
    return false;
  }
};

/**
 * Get admin setup instructions
 * @returns {string} Setup instructions
 */
export const getAdminSetupInstructions = () => {
  return `
🚀 ADMIN SETUP INSTRUCTIONS

1. FIRST TIME SETUP:
   - Run createFirstAdmin() with your admin credentials
   - This creates a super admin with full permissions
   - Only run this once!

2. SUBSEQUENT ADMINS:
   - Use the "Create Admin" button in the admin panel
   - Only existing admins can create new admins
   - Choose between Standard Admin and Super Admin levels

3. SECURITY NOTES:
   - Use strong passwords (8+ characters)
   - Only give admin access to trusted team members
   - Regularly review admin permissions
   - Monitor admin activity

4. EXAMPLE USAGE:
   import { createFirstAdmin } from './utils/createFirstAdmin';

   const result = await createFirstAdmin({
     email: 'admin@company.com',
     password: 'SecurePassword123!',
     full_name: 'System Administrator',
     company_id: 'your-company-id'
   });

   if (result.success) {
     console.log('Admin created:', result.admin);
   } else {
     console.error('Failed:', result.error);
   }
  `;
};

export default {
  createFirstAdmin,
  checkIfAdminsExist,
  getAdminSetupInstructions,
};
