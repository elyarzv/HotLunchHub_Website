// App Navigator
// Main navigation structure for the HotLunchHub app
// Handles authentication flow and role-based navigation

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Import screens
import EmployeeLoginScreen from '../screens/auth/EmployeeLoginScreen';
import CookLoginScreen from '../screens/auth/CookLoginScreen';
import DriverLoginScreen from '../screens/auth/DriverLoginScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminMealsScreen from '../screens/admin/AdminMealsScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminCompaniesScreen from '../screens/admin/AdminCompaniesScreen';
import AdminCreateAdminScreen from '../screens/admin/AdminCreateAdminScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

// Create stack navigator
const Stack = createStackNavigator();

// Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#6f42c1" />
    <Text style={styles.loadingText}>Loading HotLunchHub...</Text>
    <Text style={styles.loadingSubtext}>Initializing app and checking authentication</Text>
  </View>
);

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName="AdminLogin" // Set admin login as default
      >
        {!user ? (
          // Authentication screens - direct access to role-specific logins
          <>
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
            <Stack.Screen name="EmployeeLogin" component={EmployeeLoginScreen} />
            <Stack.Screen name="CookLogin" component={CookLoginScreen} />
            <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
          </>
        ) : (
          // Role-based navigation after login
          <>
            {user.role === 'admin' && (
              <>
                <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
                <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
                <Stack.Screen name="AdminMeals" component={AdminMealsScreen} />
                <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
                <Stack.Screen name="AdminCompanies" component={AdminCompaniesScreen} />
                <Stack.Screen name="AdminCreateAdmin" component={AdminCreateAdminScreen} />
                <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
              </>
            )}
            {/* Add other role screens here when implemented */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Styles for LoadingScreen
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6f42c1',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default AppNavigator;
