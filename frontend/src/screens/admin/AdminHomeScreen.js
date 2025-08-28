import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { supabase } from '../../services/supabase';

const AdminHomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
    
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log('Safety timeout triggered, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(safetyTimeout);
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        Alert.alert('Error', 'No authenticated user found');
        setLoading(false);
        return;
      }

      // Add timeout to profile loading
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
        // Create fallback user
        const fallbackUser = {
          id: authUser.id,
          email: authUser.email,
          role: 'admin',
          name: authUser.email?.split('@')[0] || 'Admin',
          adminCode: 'ADM',
        };
        setUser(fallbackUser);
        setLoading(false);
        return;
      }

      // Get admin details with timeout
      let adminDetails = null;
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
        
        adminDetails = adminData;
      } catch (adminError) {
        console.log('Admin details not found, using basic info');
        adminDetails = null;
      }

      setUser({
        id: authUser.id,
        email: authUser.email,
        role: profile?.role || 'admin',
        name: profile?.full_name || adminDetails?.name || 'Admin',
        adminCode: adminDetails?.admin_code || 'ADM',
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Create basic user to prevent infinite loading
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser({
            id: authUser.id,
            email: authUser.email,
            role: 'admin',
            name: authUser.email?.split('@')[0] || 'Admin',
            adminCode: 'ADM',
          });
        }
      } catch (fallbackError) {
        console.error('Fallback user creation failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Navigation will be handled by AuthContext
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
        <Text style={styles.loadingSubtext}>This should take only a few seconds</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>Welcome, {user?.name}! 👋</Text>
              <Text style={styles.subtitle}>System Administrator</Text>
              <Text style={styles.adminCode}>Admin Code: {user?.adminCode}</Text>
            </View>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>🚪 Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>📊 System Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Available Meals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Companies</Text>
            </View>
          </View>
        </View>

        {/* Admin Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>🚀 Admin Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionDescription}>Add, edit, and manage system users</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminMeals')}
          >
            <Text style={styles.actionIcon}>🍽️</Text>
            <Text style={styles.actionTitle}>Manage Meals</Text>
            <Text style={styles.actionDescription}>Add, edit, and manage available meals</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminCompanies')}
          >
            <Text style={styles.actionIcon}>🏢</Text>
            <Text style={styles.actionTitle}>Manage Companies</Text>
            <Text style={styles.actionDescription}>Add, edit, and manage company information</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminOrders')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>View Orders</Text>
            <Text style={styles.actionDescription}>Monitor and manage all system orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminCreateAdmin')}
          >
            <Text style={styles.actionIcon}>👑</Text>
            <Text style={styles.actionTitle}>Create Admin</Text>
            <Text style={styles.actionDescription}>Add new administrator users</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminProfile')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionTitle}>Admin Profile</Text>
            <Text style={styles.actionDescription}>View and edit your admin profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Floating Sign Out Button */}
      <TouchableOpacity 
        style={styles.floatingSignOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.floatingSignOutButtonText}>🚪</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#6f42c1',
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  adminCode: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  signOutButton: {
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6f42c1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6f42c1',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  userInfoContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfoCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  userInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  signOutButton: {
    backgroundColor: '#dc3545',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingSignOutButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#dc3545',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingSignOutButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
});

export default AdminHomeScreen;

