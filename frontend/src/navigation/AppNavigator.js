// App Navigator
// Main navigation structure for the HotLunchHub app
// Handles authentication flow and role-based navigation

import React, { useContext, useEffect, useRef } from 'react';
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
import AdminEmployeesScreen from '../screens/admin/AdminEmployeesScreen';
import AdminCooksScreen from '../screens/admin/AdminCooksScreen';
import AdminDriversScreen from '../screens/admin/AdminDriversScreen';
import AdminCompaniesScreen from '../screens/admin/AdminCompaniesScreen';
import CookHomeScreen from '../screens/cook/CookHomeScreen';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import EmployeeHomeScreen from '../screens/employee/EmployeeHomeScreen';

// Create stack navigator
const Stack = createStackNavigator();

// Helper function to get initial route based on user role
const getInitialRouteName = (role) => {
  switch (role) {
    case 'admin':
      return 'AdminDashboard';
    case 'cook':
      return 'CookHome';
    case 'driver':
      return 'DriverHome';
    case 'employee':
      return 'EmployeeHome';
    default:
      return 'AdminLogin';
  }
};

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
  const navigationRef = useRef(null);

  // Handle navigation when user state changes
  useEffect(() => {
    if (!loading && navigationRef.current) {
      const currentScreen = getCurrentScreen();
      console.log('🔄 User state changed, navigating to:', currentScreen);
      
      // Navigate to the appropriate screen based on user state
      if (currentScreen === 'AdminLogin') {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'AdminLogin' }],
        });
      } else {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: currentScreen }],
        });
      }
    }
  }, [user, loading]);

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Determine which screen to show based on user state
  const getCurrentScreen = () => {
    if (!user) {
      return 'AdminLogin';
    }
    
    switch (user.role) {
      case 'admin':
        return 'AdminDashboard';
      case 'cook':
        return 'CookHome';
      case 'driver':
        return 'DriverHome';
      case 'employee':
        return 'EmployeeHome';
      default:
        return 'AdminLogin';
    }
  };

  const currentScreen = getCurrentScreen();
  console.log('🎯 Current screen should be:', currentScreen, 'for user role:', user?.role);

  return (
    <NavigationContainer 
      ref={navigationRef}
      linking={linking}
      onStateChange={(state) => {
        console.log('🔗 Navigation state changed:', state?.routes?.[state.index]?.name);
      }}
      onReady={() => {
        console.log('🚀 Navigation container ready');
      }}
    >
      <Stack.Navigator 
        key={user ? `user-${user.role}-${user.id}` : 'no-user'}
        screenOptions={{ headerShown: false }}
        initialRouteName={currentScreen}
      >
        {/* Always define all screens, but control access through navigation logic */}
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="EmployeeLogin" component={EmployeeLoginScreen} />
        <Stack.Screen name="CookLogin" component={CookLoginScreen} />
        <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
        
        {/* Role-based screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="ManageUsers" component={ManageUsers} />
        <Stack.Screen name="AdminMeals" component={AdminMealsScreen} />
        <Stack.Screen name="AdminEmployees" component={AdminEmployeesScreen} />
        <Stack.Screen name="AdminCooks" component={AdminCooksScreen} />
        <Stack.Screen name="AdminDrivers" component={AdminDriversScreen} />
        <Stack.Screen name="AdminCompanies" component={AdminCompaniesScreen} />
        <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
        <Stack.Screen name="CookHome" component={CookHomeScreen} />
        <Stack.Screen name="EmployeeHome" component={EmployeeHomeScreen} />
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
