import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { supabase } from '../../services/supabase';

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalMeals: 0,
    totalCompanies: 0,
    totalEmployees: 0,
    totalDrivers: 0,
    totalCooks: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current user and admin info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        setAdminInfo(adminData);
      }

      const [
        ordersCount,
        mealsCount,
        companiesCount,
        employeesCount,
        driversCount,
        cooksCount,
        recentOrdersData,
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('meals').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('drivers').select('*', { count: 'exact', head: true }),
        supabase.from('cooks').select('*', { count: 'exact', head: true }),
        supabase
          .from('orders')
          .select(`
            order_id,
            order_date,
            status,
            quantity,
            employees!inner(name),
            meals!inner(name),
            companies!inner(name)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setStats({
        totalOrders: ordersCount.count || 0,
        totalMeals: mealsCount.count || 0,
        totalCompanies: companiesCount.count || 0,
        totalEmployees: employeesCount.count || 0,
        totalDrivers: driversCount.count || 0,
        totalCooks: cooksCount.count || 0,
      });

      setRecentOrders(recentOrdersData.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Wrapper with flex:1 ensures ScrollView knows its height */}
      <View style={styles.scrollWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerInfo}>
                <Text style={styles.greeting}>
                  Hi, {adminInfo?.name || 'Admin'}! 👋
                </Text>
                <Text style={styles.subtitle}>System Overview & Reports</Text>
              </View>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>🚪 Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>📊 System Statistics</Text>
            <View style={styles.statsGrid}>
              {Object.entries(stats).map(([key, value]) => (
                <View key={key} style={styles.statCard}>
                  <Text style={styles.statNumber}>{value}</Text>
                  <Text style={styles.statLabel}>{formatStatLabel(key)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Orders */}
          <View style={styles.recentOrdersContainer}>
            <Text style={styles.sectionTitle}>📋 Recent Orders</Text>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <View key={order.order_id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>Order #{order.order_id}</Text>
                    <Text
                      style={[styles.orderStatus, { color: getStatusColor(order.status) }]}
                    >
                      {order.status}
                    </Text>
                  </View>
                  <Text style={styles.orderDetails}>
                    {order.employees?.name} ordered {order.meals?.name} from{' '}
                    {order.companies?.name}
                  </Text>
                  <Text style={styles.orderDate}>
                    Date: {new Date(order.order_date).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No orders yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Orders will appear here when they're created
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionTitle}>View All Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('AdminMeals')}
              >
                <Text style={styles.actionIcon}>🍽️</Text>
                <Text style={styles.actionTitle}>Manage Meals</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>🏢</Text>
                <Text style={styles.actionTitle}>Manage Companies</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('ManageUsers')}
              >
                <Text style={styles.actionIcon}>👥</Text>
                <Text style={styles.actionTitle}>Manage Users</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Helper to make stat labels readable
const formatStatLabel = (key) => {
  return key
    .replace('total', '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '#ffa500';
    case 'confirmed':
      return '#007bff';
    case 'preparing':
      return '#17a2b8';
    case 'ready':
      return '#28a745';
    case 'delivered':
      return '#6c757d';
    case 'cancelled':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

const styles = StyleSheet.create({
    container: {
    backgroundColor: '#f8f9fa',
    height: Platform.OS === 'web' ? '100vh' : '100%', // full height on web
    flex: Platform.OS === 'web' ? undefined : 1,
},
  scrollWrapper: {
    flex: 1, // critical for ScrollView to scroll on web
  },
  scrollContent: {
    paddingBottom: 20,
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
  },
  header: {
    backgroundColor: '#6f42c1',
    padding: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    marginBottom: 8,
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
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
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
  recentOrdersContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  orderCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#6f42c1',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AdminDashboard;