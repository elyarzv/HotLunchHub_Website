// App Navigator
// Main navigation structure for the HotLunchHub app
// Handles authentication flow and role-based navigation

import React, { useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';

// Import screens
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import EmployeeLoginScreen from '../screens/auth/EmployeeLoginScreen';
import CookLoginScreen from '../screens/auth/CookLoginScreen';
import DriverLoginScreen from '../screens/auth/DriverLoginScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageUsers from '../screens/admin/ManageUsers';
import AdminMealsScreen from '../screens/admin/AdminMealsScreen';
import CookHomeScreen from '../screens/cook/CookHomeScreen';

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

// Deep linking configuration
const linking = {
  prefixes: ['http://localhost:8081', 'https://localhost:8081', 'http://localhost:3000', 'https://localhost:3000'],
  config: {
    screens: {
      AdminLogin: {
        path: 'adminlogin',
        parse: {},
      },
      DriverLogin: {
        path: 'driverlogin',
        parse: {},
      },
      CookLogin: {
        path: 'cooklogin',
        parse: {},
      },
      EmployeeLogin: {
        path: 'employeelogin',
        parse: {},
      },
      AdminDashboard: {
        path: 'admindashboard',
        parse: {},
      },
      ManageUsers: {
        path: 'manageusers',
        parse: {},
      },
      AdminMeals: {
        path: 'adminmeals',
        parse: {},
      },
      DriverHome: {
        path: 'driverhome',
        parse: {},
      },
      CookHome: {
        path: 'cookhome',
        parse: {},
      },
      EmployeeHome: {
        path: 'employeehome',
        parse: {},
      },
    },
  },
  async getInitialURL() {
    // Log the initial URL for debugging
    console.log('🔗 Getting initial URL for deep linking');
    return null;
  },
  subscribe(listener) {
    // Log when deep links are subscribed to
    console.log('🔗 Deep linking subscription started');
    
    return {
      remove() {
        console.log('🔗 Deep linking subscription removed');
      },
    };
  },
};

// Main App Navigator
const AppNavigator = () => {
  let context;
  try {
    context = useContext(AuthContext);
    console.log('🔍 AppNavigator: AuthContext accessed successfully');
  } catch (error) {
    console.error('❌ AppNavigator: Error accessing AuthContext:', error);
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Error</Text>
        <Text style={styles.loadingSubtext}>Failed to initialize authentication</Text>
        <Text style={styles.loadingSubtext}>{error.message}</Text>
      </View>
    );
  }
  
  // Safety check: ensure context is properly initialized
  if (!context) {
    console.error('❌ AuthContext is not available');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing...</Text>
        <Text style={styles.loadingSubtext}>Setting up authentication context</Text>
      </View>
    );
  }
  
  const { user, loading } = context;

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer 
      linking={linking}
      onStateChange={(state) => {
        console.log('🔗 Navigation state changed:', state?.routes?.[state.index]?.name);
      }}
      onReady={() => {
        console.log('🚀 Navigation container ready');
      }}
    >
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
                <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
                <Stack.Screen name="ManageUsers" component={ManageUsers} />
                <Stack.Screen name="AdminMeals" component={AdminMealsScreen} />
              </>
            )}
            {user.role === 'driver' && (
              <>
                <Stack.Screen name="DriverHome" component={() => <View><Text>Driver Home</Text></View>} />
              </>
            )}
            {user.role === 'cook' && (
              <>
                <Stack.Screen name="CookHome" component={CookHomeScreen} />
              </>
            )}
            {user.role === 'employee' && (
              <>
                <Stack.Screen name="EmployeeHome" component={() => <View><Text>Employee Home</Text></View>} />
              </>
            )}
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
