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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .eq('role', role)
        .single();

      if (profileError || !profile) {
        console.error(`❌ ${role} profile not found:`, profileError);
        Alert.alert(
          'Access Denied', 
          `This account does not have ${role} privileges. Please use the correct login page.`
        );
        
        // Sign out the user since they don't have the right role
        await supabase.auth.signOut();
        return;
      }

      console.log(`✅ ${role} profile found:`, profile);

      // 3. Get role-specific details
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
          const { data: roleData } = await supabase
            .from(roleTable)
            .select('*')
            .eq(idField, data.user.id)
            .single();
          
          roleDetails = roleData;
        }
      } catch (roleError) {
        console.log(`⚠️ ${role} details not found, but profile exists`);
        // Continue with basic role info
      }

      console.log(`🎉 ${role} login successful!`);
      Alert.alert('Success', `Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)}!`, [
        {
          text: 'OK',
          onPress: () => {
            // The AuthContext will handle navigation based on user role
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
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
