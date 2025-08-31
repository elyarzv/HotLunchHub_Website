import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '../../services/supabase';

/**
 * Generic LoginScreen component that handles authentication for all user roles
 * 
 * Role Validation:
 * 1. Authenticates user with Supabase Auth
 * 2. Validates user has correct role in profiles table
 * 3. Validates user exists in role-specific table (admins, drivers, cooks, employees)
 * 4. Shows appropriate error messages for role mismatches
 * 5. Signs out unauthorized users automatically
 */
const LoginScreen = ({ role, navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Role-specific configurations
  const roleConfig = {
    employee: {
      title: '👷 Employee Login',
      subtitle: 'Order delicious meals',
      description: 'Access your meal ordering dashboard',
      color: '#007AFF',
      icon: '🍽️',
      redirectScreen: 'EmployeeHome',
    },
    cook: {
      title: '👨‍🍳 Cook Login',
      subtitle: 'Kitchen Management',
      description: 'Manage meal preparation and orders',
      color: '#ff6b35',
      icon: '🔥',
      redirectScreen: 'CookHome',
    },
    driver: {
      title: '🚚 Driver Login',
      subtitle: 'Delivery Management',
      description: 'Handle deliveries and order status',
      color: '#28a745',
      icon: '📦',
      redirectScreen: 'DriverHome',
    },
    admin: {
      title: '👑 Admin Login',
      subtitle: 'System Administration',
      description: 'Full system access and management',
      color: '#6f42c1',
      icon: '⚙️',
      redirectScreen: 'AdminHome',
    },
  };

  const config = roleConfig[role];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log(`🔑 Attempting ${role} login for:`, email);
      
      // 1. Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Auth error:', error);
        Alert.alert('Login Failed', error.message);
        return;
      }

      if (!data.user) {
        Alert.alert('Login Failed', 'No user data received');
        return;
      }

      console.log('✅ Auth successful for user:', data.user.id);

      // 2. Check if user has the correct role profile
      console.log(`🔍 Checking if user has ${role} role for user ID:`, data.user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .eq('role', role)
        .single();

      console.log('🔍 Profile check result:', { profile, profileError });

      if (profileError || !profile) {
        console.error(`❌ ${role} profile not found:`, profileError);
        
        // Clear the form first
        setEmail('');
        setPassword('');
        
        // Show simple error message first
        console.log('🔴 Showing access denied alert...');
        
        // Force the alert to show immediately
        Alert.alert(
          'Access Denied', 
          `This account is not in the ${role} list.`,
          [
            {
              text: 'OK',
              onPress: async () => {
                console.log('User dismissed access denied alert');
                // Sign out after user dismisses alert
                await supabase.auth.signOut();
              }
            }
          ],
          { cancelable: false }
        );
        
        console.log('🔴 Alert should be visible now');
        return;
      }

      console.log(`✅ ${role} profile found:`, profile);

      // 3. Get role-specific details and validate role table entry
      let roleDetails = null;
      try {
        let roleTable = '';
        let idField = '';
        
        switch (role) {
          case 'employee':
            roleTable = 'employees';
            idField = 'auth_id';
            break;
          case 'cook':
            roleTable = 'cooks';
            idField = 'auth_id';
            break;
          case 'driver':
            roleTable = 'drivers';
            idField = 'auth_id';
            break;
          case 'admin':
            roleTable = 'admins';
            idField = 'auth_id';
            break;
        }

        if (roleTable && idField) {
          const { data: roleData, error: roleTableError } = await supabase
            .from(roleTable)
            .select('*')
            .eq(idField, data.user.id)
            .single();
          
          if (roleTableError || !roleData) {
            console.error(`❌ ${role} not found in ${roleTable} table:`, roleTableError);
            Alert.alert(
              'Access Denied', 
              `${role.charAt(0).toUpperCase() + role.slice(1)} profile not found. Please contact system administrator.`,
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    await supabase.auth.signOut();
                  }
                }
              ],
              { cancelable: false }
            );
            return;
          }
          
          roleDetails = roleData;
        }
      } catch (roleError) {
        console.error(`❌ Error checking ${role} details:`, roleError);
        Alert.alert(
          'Access Denied', 
          `Error validating ${role} access. Please contact system administrator.`,
          [
            {
              text: 'OK',
              onPress: async () => {
                await supabase.auth.signOut();
              }
            }
          ],
          { cancelable: false }
        );
        return;
      }

      console.log(`🎉 ${role} login successful!`);
      
      // The AuthContext will automatically load the profile and trigger navigation
      // No need to manually call loadUserProfile here
      
      Alert.alert('Success', `Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)}!`, [
        {
          text: 'OK',
          onPress: () => {
            console.log(`Redirecting to ${config.redirectScreen}`);
          }
        }
      ]);

    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Login Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
          <Text style={styles.description}>{config.description}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your-email@company.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: config.color }, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Signing In...' : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </Text>
          </TouchableOpacity>

          <View style={styles.roleInfo}>
            <Text style={styles.roleInfoText}>
              {config.icon} {role.charAt(0).toUpperCase() + role.slice(1)} Access Only
            </Text>
            <Text style={styles.roleInfoSubtext}>
              If you're not a {role}, please use the correct login page
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Secure {role} access only
          </Text>
          <Text style={styles.footerSubtext}>
            Contact system administrator for access
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#a8a8a8',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a4a6b',
  },
  loginButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  roleInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleInfoText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  roleInfoSubtext: {
    fontSize: 14,
    color: '#a8a8a8',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  footerText: {
    color: '#a8a8a8',
    fontSize: 14,
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#666',
    fontSize: 12,
  },
});

export default LoginScreen;
