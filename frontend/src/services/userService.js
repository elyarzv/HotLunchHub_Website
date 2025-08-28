// User Service
// Handles all user management operations for administrators
// Creates users in profiles table and role-specific tables

import { supabase } from './supabase';
import { CONFIG } from '../constants/config';

class UserService {
  // Get all users with their role details
  async getAllUsers() {
    console.log('🔍 Fetching all users...');
    
    try {
      // 1. Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      console.log('📋 Found profiles:', profiles);

      // 2. Get role-specific data for each user
      const usersWithDetails = await Promise.all(
        profiles.map(async (profile) => {
          let roleData = null;
          let roleError = null;

          try {
            switch (profile.role) {
              case 'employee':
                const { data: employee } = await supabase
                  .from('employees')
                  .select('*')
                  .eq('auth_id', profile.id)
                  .single();
                roleData = employee;
                break;

              case 'cook':
                const { data: cook } = await supabase
                  .from('cooks')
                  .select('*')
                  .eq('auth_id', profile.id)
                  .single();
                roleData = cook;
                break;

              case 'driver':
                const { data: driver } = await supabase
                  .from('drivers')
                  .select('*')
                  .eq('auth_id', profile.id)
                  .single();
                roleData = driver;
                break;

              case 'admin':
                const { data: admin } = await supabase
                  .from('admins')
                  .select('*')
                  .eq('auth_id', profile.id)
                  .single();
                roleData = admin;
                break;

              default:
                console.warn('⚠️ Unknown role:', profile.role);
                roleData = null;
            }
          } catch (error) {
            console.warn(`⚠️ Error fetching ${profile.role} data for user ${profile.id}:`, error);
            roleData = null;
          }

          // Combine profile and role data
          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            status: profile.status,
            company_id: profile.company_id,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            ...roleData
          };
        })
      );

      console.log('✅ Users with details:', usersWithDetails);
      return { data: usersWithDetails, error: null };

    } catch (error) {
      console.error('❌ Error in getAllUsers:', error);
      throw error;
    }
  }

  // Create a new user (profile + role-specific table)
  async createUser(userData) {
    console.log('🚀 Creating new user:', userData);
    console.log('🔍 User data received:', JSON.stringify(userData, null, 2));

    try {
      // 1. Create user in Supabase Auth using signUp (works with client permissions)
      console.log('📧 Attempting to create auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
          }
        }
      });

      if (authError) {
        console.error('❌ Auth creation error:', authError);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      if (!authData.user) {
        console.error('❌ No user data returned from auth creation');
        throw new Error('Failed to create user account: No user data returned');
      }

      console.log('✅ Auth user created successfully:', authData.user.id);

      // 2. Create profile record
      console.log('👤 Creating profile record...');
      const profileData = {
        id: authData.user.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role,
        company_id: userData.company_id || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        // Try to delete the auth user if profile creation fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('🗑️ Auth user deleted due to profile creation failure');
        } catch (deleteError) {
          console.error('⚠️ Failed to delete auth user:', deleteError);
        }
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('✅ Profile created successfully:', profile.id);

      // 3. Create role-specific record based on selected role
      console.log('🎭 Creating role-specific record for:', userData.role);
      let roleRecord = null;
      let roleError = null;

      switch (userData.role) {
        case 'employee':
          const employeeData = {
            auth_id: authData.user.id,
            employee_code: `EMP${Date.now()}`,
            department: userData.employee_fields?.department || '',
            position: userData.employee_fields?.position || '',
            employee_id: userData.employee_fields?.employee_id || '',
            company_id: userData.company_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: employee, error: empError } = await supabase
            .from('employees')
            .insert([employeeData])
            .select()
            .single();
          
          roleRecord = employee;
          roleError = empError;
          break;

        case 'cook':
          const cookData = {
            auth_id: authData.user.id,
            cook_code: `COOK${Date.now()}`,
            kitchen_location: userData.cook_fields?.kitchen_location || '',
            specialty: userData.cook_fields?.specialty || '',
            experience_years: userData.cook_fields?.experience_years || '',
            company_id: userData.company_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: cook, error: cookError } = await supabase
            .from('cooks')
            .insert([cookData])
            .select()
            .single();
          
          roleRecord = cook;
          roleError = cookError;
          break;

        case 'driver':
          const driverData = {
            auth_id: authData.user.id,
            driver_code: `DRIVER${Date.now()}`,
            vehicle_type: userData.driver_fields?.vehicle_type || '',
            license_number: userData.driver_fields?.license_number || '',
            delivery_zone: userData.driver_fields?.delivery_zone || '',
            company_id: userData.company_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: driver, error: driverError } = await supabase
            .from('drivers')
            .insert([driverData])
            .select()
            .single();
          
          roleRecord = driver;
          roleError = driverError;
          break;

        case 'admin':
          const adminData = {
            auth_id: authData.user.id,
            admin_code: `ADM${Date.now()}`,
            name: userData.full_name,
            company_id: userData.company_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: admin, error: adminError } = await supabase
            .from('admins')
            .insert([adminData])
            .select()
            .single();
          
          roleRecord = admin;
          roleError = adminError;
          break;

        default:
          throw new Error(`Invalid role: ${userData.role}`);
      }

      if (roleError) {
        console.error('❌ Role-specific record creation error:', roleError);
        // Try to clean up profile and auth user if role creation fails
        try {
          await supabase.from('profiles').delete().eq('id', authData.user.id);
          console.log('🗑️ Profile deleted due to role creation failure');
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('🗑️ Auth user deleted due to role creation failure');
        } catch (cleanupError) {
          console.error('⚠️ Failed to cleanup after role creation failure:', cleanupError);
        }
        throw new Error(`Failed to create ${userData.role} record: ${roleError.message}`);
      }

      console.log('✅ Role-specific record created successfully:', roleRecord);

      // 4. Combine all data into a complete user object
      const createdUser = {
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        status: 'active',
        created_at: profile.created_at,
        ...roleRecord
      };

      console.log('🎉 User creation completed successfully:', createdUser);

      // 5. Check if email confirmation is required
      if (!authData.user.email_confirmed_at) {
        return {
          data: createdUser,
          error: null,
          warning: `User created successfully! ${userData.email} needs to confirm their email address before they can sign in.`
        };
      }

      return { data: createdUser, error: null };

    } catch (error) {
      console.error('❌ Error in createUser:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  // Update user information
  async updateUser(userId, updateData) {
    try {
      console.log('✏️ Updating user:', userId, updateData);
      
      // 1. Update profile if basic info changed
      if (updateData.full_name || updateData.role || updateData.status) {
        const profileUpdates = {};
        if (updateData.full_name) profileUpdates.full_name = updateData.full_name;
        if (updateData.role) profileUpdates.role = updateData.role;
        if (updateData.status) profileUpdates.status = updateData.status;

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId);

        if (profileError) {
          console.error('Profile update error:', profileError);
          throw new Error(`Failed to update profile: ${profileError.message}`);
        }
      }

      // 2. Update role-specific table
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile) {
        throw new Error('User profile not found');
      }

      let roleError = null;
      switch (currentProfile.role) {
        case 'employee':
          if (updateData.employee_fields) {
            const { error: employeeError } = await supabase
              .from('employees')
              .update({
                department: updateData.employee_fields.department,
                position: updateData.employee_fields.position,
                employee_id: updateData.employee_fields.employee_id,
              })
              .eq('auth_id', userId);
            roleError = employeeError;
          }
          break;

        case 'cook':
          if (updateData.cook_fields) {
            const { error: cookError } = await supabase
              .from('cooks')
              .update({
                kitchen_location: updateData.cook_fields.kitchen_location,
                specialty: updateData.cook_fields.specialty,
                experience_years: updateData.cook_fields.experience_years,
              })
              .eq('auth_id', userId);
            roleError = cookError;
          }
          break;

        case 'driver':
          if (updateData.driver_fields) {
            const { error: driverError } = await supabase
              .from('drivers')
              .update({
                vehicle_type: updateData.driver_fields.vehicle_type,
                license_number: updateData.driver_fields.license_number,
                delivery_zone: updateData.driver_fields.delivery_zone,
              })
              .eq('auth_id', userId);
            roleError = driverError;
          }
          break;
      }

      if (roleError) {
        console.error('Role-specific update error:', roleError);
        throw new Error(`Failed to update ${currentProfile.role} record: ${roleError.message}`);
      }

      console.log('✅ User updated successfully');
      return { data: { id: userId, ...updateData }, error: null };

    } catch (error) {
      console.error('❌ Error in updateUser:', error);
      return { data: null, error: error.message };
    }
  }

  // Delete user (profile + role-specific table + auth)
  async deleteUser(userId) {
    console.log('🗑️ Deleting user:', userId);
    
    try {
      // 1. Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      console.log('👤 User role:', profile.role);

      // 2. Delete role-specific record first
      let roleError = null;
      switch (profile.role) {
        case 'employee':
          const { error: empError } = await supabase
            .from('employees')
            .delete()
            .eq('auth_id', userId);
          roleError = empError;
          break;
        case 'cook':
          const { error: cookError } = await supabase
            .from('cooks')
            .delete()
            .eq('auth_id', userId);
          roleError = cookError;
          break;
        case 'driver':
          const { error: driverError } = await supabase
            .from('drivers')
            .delete()
            .eq('auth_id', userId);
          roleError = driverError;
          break;
        case 'admin':
          const { error: adminError } = await supabase
            .from('admins')
            .delete()
            .eq('auth_id', userId);
          roleError = adminError;
          break;
        default:
          throw new Error(`Unknown role: ${profile.role}`);
      }

      if (roleError) {
        console.error('❌ Error deleting role-specific record:', roleError);
        throw new Error(`Failed to delete ${profile.role} record: ${roleError.message}`);
      }

      console.log('✅ Role-specific record deleted successfully');

      // 3. Delete profile record
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        console.error('❌ Error deleting profile:', profileDeleteError);
        throw new Error(`Failed to delete profile: ${profileDeleteError.message}`);
      }

      console.log('✅ Profile deleted successfully');

      // Note: We cannot delete the auth user from client-side due to permissions
      // The auth user will remain but won't have access to the app
      console.log('⚠️ Note: Auth user remains in Supabase Auth (cannot delete from client-side)');
      console.log('✅ User profile and role data deleted successfully');
      
      return { data: { id: userId }, error: null };

    } catch (error) {
      console.error('❌ Error in deleteUser:', error);
      throw error;
    }
  }

  // Get user profile by ID
  async getUserProfile(userId) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Helper method to extract role-specific fields
  getRoleSpecificFields(role, userData) {
    switch (role) {
      case 'employee':
        return {
          department: userData.employee_fields?.department || null,
          position: userData.employee_fields?.position || null,
          employee_id: userData.employee_fields?.employee_id || null,
        };
      case 'cook':
        return {
          kitchen_location: userData.cook_fields?.kitchen_location || null,
          specialty: userData.cook_fields?.specialty || null,
          experience_years: userData.cook_fields?.experience_years || null,
        };
      case 'driver':
        return {
          vehicle_type: userData.driver_fields?.vehicle_type || null,
          license_number: userData.driver_fields?.license_number || null,
          delivery_zone: userData.driver_fields?.delivery_zone || null,
        };
      default:
        return {};
    }
  }
}

export const userService = new UserService();
export default userService;
