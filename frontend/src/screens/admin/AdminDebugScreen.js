// Admin Debug Screen
// Temporary screen to debug admin authentication issues

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/common/CustomButton';
import { testDatabaseConnection } from '../../services/supabase';

const AdminDebugScreen = ({ navigation }) => {
  const { user, session, loading, error, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Success', 'Signed out successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out: ' + error.message);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleTestDatabase = async () => {
    try {
      Alert.alert('Testing', 'Testing database connection...');
      const result = await testDatabaseConnection();
      Alert.alert(
        'Database Test Result', 
        `Connection: ${result.connection ? '✅ Success' : '❌ Failed'}\n` +
        `Profiles Table: ${result.profilesTableExists ? '✅ Exists' : '❌ Missing'}\n` +
        `Error: ${result.error || 'None'}`
      );
    } catch (error) {
      Alert.alert('Error', 'Database test failed: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Admin Debug Screen</Text>
        <Text style={styles.subtitle}>Debugging authentication issues</Text>
      </View>

      {/* Authentication State */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Authentication State</Text>
        <View style={styles.debugContainer}>
          <Text style={styles.debugLabel}>Loading:</Text>
          <Text style={styles.debugValue}>{loading ? 'Yes' : 'No'}</Text>
          
          <Text style={styles.debugLabel}>Error:</Text>
          <Text style={styles.debugValue}>{error || 'None'}</Text>
          
          <Text style={styles.debugLabel}>Session Active:</Text>
          <Text style={styles.debugValue}>{session ? 'Yes' : 'No'}</Text>
        </View>
      </View>

      {/* User Object */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 User Object</Text>
        <View style={styles.debugContainer}>
          <Text style={styles.debugLabel}>User exists:</Text>
          <Text style={styles.debugValue}>{user ? 'Yes' : 'No'}</Text>
          
          {user && (
            <>
              <Text style={styles.debugLabel}>User ID:</Text>
              <Text style={styles.debugValue}>{user.id || 'N/A'}</Text>
              
              <Text style={styles.debugLabel}>User Role:</Text>
              <Text style={styles.debugValue}>{user.role || 'N/A'}</Text>
              
              <Text style={styles.debugLabel}>Full Name:</Text>
              <Text style={styles.debugValue}>{user.full_name || 'N/A'}</Text>
              
              <Text style={styles.debugLabel}>Email:</Text>
              <Text style={styles.debugValue}>{user.email || 'N/A'}</Text>
              
              <Text style={styles.debugLabel}>Company ID:</Text>
              <Text style={styles.debugValue}>{user.company_id || 'N/A'}</Text>
              
              <Text style={styles.debugLabel}>Status:</Text>
              <Text style={styles.debugValue}>{user.status || 'N/A'}</Text>
            </>
          )}
        </View>
      </View>

      {/* Raw User Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Raw User Data</Text>
        <View style={styles.debugContainer}>
          <Text style={styles.debugLabel}>JSON:</Text>
          <Text style={styles.debugValue}>
            {user ? JSON.stringify(user, null, 2) : 'No user data'}
          </Text>
        </View>
      </View>

      {/* Session Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎫 Session Data</Text>
        <View style={styles.debugContainer}>
          <Text style={styles.debugLabel}>Session JSON:</Text>
          <Text style={styles.debugValue}>
            {session ? JSON.stringify(session, null, 2) : 'No session data'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Actions</Text>
        <View style={styles.buttonContainer}>
          <CustomButton
            title="🧪 Test Database"
            onPress={handleTestDatabase}
            style={styles.actionButton}
            size="large"
          />
          <CustomButton
            title="Go Back"
            onPress={handleGoBack}
            style={styles.actionButton}
            size="large"
          />
          <CustomButton
            title="Sign Out"
            onPress={handleSignOut}
            style={styles.signOutButton}
            size="large"
          />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Debug Instructions</Text>
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionText}>
            1. Check if user object exists and has correct properties
          </Text>
          <Text style={styles.instructionText}>
            2. Verify user.role is exactly 'admin' (case sensitive)
          </Text>
          <Text style={styles.instructionText}>
            3. Check if session is properly set
          </Text>
          <Text style={styles.instructionText}>
            4. Look for any error messages
          </Text>
          <Text style={styles.instructionText}>
            5. Verify database has correct user record
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  debugContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  debugLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  debugValue: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'monospace',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
  },
  signOutButton: {
    backgroundColor: '#dc3545',
  },
  instructionsContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default AdminDebugScreen;
