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
  Modal,
  FlatList,
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
  const [selectedStatData, setSelectedStatData] = useState(null);
  const [showStatModal, setShowStatModal] = useState(false);

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

  const handleStatPress = async (statType) => {
    try {
      setLoading(true);
      let data = [];
      let title = '';

      switch (statType) {
        case 'totalOrders':
          const { data: ordersData } = await supabase
            .from('orders')
            .select(`
              order_id,
              order_date,
              status,
              quantity,
              employees!inner(name, employee_code),
              meals!inner(name),
              companies!inner(name)
            `)
            .order('created_at', { ascending: false });
          data = ordersData || [];
          title = 'All Orders';
          break;

        case 'totalMeals':
          // Navigate to AdminMeals page instead of showing modal
          navigation.navigate('AdminMeals');
          return;

        case 'totalCompanies':
          // Navigate to AdminCompanies page instead of showing modal
          navigation.navigate('AdminCompanies');
          return;

        case 'totalEmployees':
          // Navigate to AdminEmployees page instead of showing modal
          navigation.navigate('AdminEmployees');
          return;

        case 'totalDrivers':
          // Navigate to AdminDrivers page instead of showing modal
          navigation.navigate('AdminDrivers');
          return;

        case 'totalCooks':
          // Navigate to AdminCooks page instead of showing modal
          navigation.navigate('AdminCooks');
          return;

        default:
          return;
      }

      setSelectedStatData({ data, title, type: statType });
      setShowStatModal(true);
    } catch (error) {
      console.error('Error fetching stat data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
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
                <TouchableOpacity 
                  key={key} 
                  style={styles.statCard}
                  onPress={() => handleStatPress(key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statNumber}>{value}</Text>
                  <Text style={styles.statLabel}>{formatStatLabel(key)}</Text>
                </TouchableOpacity>
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

      {/* Statistics Detail Modal */}
      <Modal
        visible={showStatModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedStatData?.title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStatModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {selectedStatData?.data && selectedStatData.data.length > 0 ? (
              <FlatList
                data={selectedStatData.data}
                keyExtractor={(item, index) => {
                  const idField = Object.keys(item).find(key => key.includes('_id'));
                  return idField ? item[idField].toString() : index.toString();
                }}
                renderItem={({ item }) => renderStatItem(item, selectedStatData.type)}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.flatListContent}
              />
            ) : (
              <View style={styles.emptyModalState}>
                <Text style={styles.emptyModalText}>No data available</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// Helper function to render different types of data items
const renderStatItem = (item, type) => {
  switch (type) {
    case 'totalOrders':
      return (
        <View style={styles.modalItemCard}>
          <View style={styles.modalItemHeader}>
            <Text style={styles.modalItemTitle}>Order #{item.order_id}</Text>
            <Text style={[styles.modalItemStatus, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Employee: </Text>
            {item.employees?.name} ({item.employees?.employee_code})
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Meal: </Text>
            {item.meals?.name}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Company: </Text>
            {item.companies?.name}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Quantity: </Text>
            {item.quantity}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Date: </Text>
            {new Date(item.order_date).toLocaleDateString()}
          </Text>
        </View>
      );

    case 'totalMeals':
      return (
        <View style={styles.modalItemCard}>
          <View style={styles.modalItemHeader}>
            <Text style={styles.modalItemTitle}>{item.name}</Text>
            {item.is_weekly_special && (
              <View style={styles.specialBadge}>
                <Text style={styles.specialText}>Special</Text>
              </View>
            )}
          </View>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Price: </Text>
            ${item.price}
          </Text>
          {item.description && (
            <Text style={styles.modalItemText}>
              <Text style={styles.modalItemLabel}>Description: </Text>
              {item.description}
            </Text>
          )}
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Created: </Text>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      );

    case 'totalCompanies':
      return (
        <View style={styles.modalItemCard}>
          <View style={styles.modalItemHeader}>
            <Text style={styles.modalItemTitle}>{item.name}</Text>
          </View>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Contact: </Text>
            {item.contact_person}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Phone: </Text>
            {item.phone}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Email: </Text>
            {item.email}
          </Text>
          {item.address && (
            <Text style={styles.modalItemText}>
              <Text style={styles.modalItemLabel}>Address: </Text>
              {item.address}
            </Text>
          )}
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Created: </Text>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      );

    case 'totalEmployees':
      return (
        <View style={styles.modalItemCard}>
          <View style={styles.modalItemHeader}>
            <Text style={styles.modalItemTitle}>{item.name}</Text>
            <Text style={styles.modalItemStatus}>{item.employee_code}</Text>
          </View>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Email: </Text>
            {item.email}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Phone: </Text>
            {item.phone}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Company: </Text>
            {item.companies?.name}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Created: </Text>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      );

    case 'totalDrivers':
      return (
        <View style={styles.modalItemCard}>
          <View style={styles.modalItemHeader}>
            <Text style={styles.modalItemTitle}>{item.name}</Text>
            <Text style={styles.modalItemStatus}>ID: {item.driver_id}</Text>
          </View>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Email: </Text>
            {item.email}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Phone: </Text>
            {item.phone}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Created: </Text>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      );

    case 'totalCooks':
      return (
        <View style={styles.modalItemCard}>
          <View style={styles.modalItemHeader}>
            <Text style={styles.modalItemTitle}>{item.name}</Text>
            <Text style={styles.modalItemStatus}>ID: {item.cook_id}</Text>
          </View>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Email: </Text>
            {item.email}
          </Text>
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Phone: </Text>
            {item.phone}
          </Text>
          {item.address_line1 && (
            <Text style={styles.modalItemText}>
              <Text style={styles.modalItemLabel}>Address: </Text>
              {item.address_line1}, {item.city}
            </Text>
          )}
          <Text style={styles.modalItemText}>
            <Text style={styles.modalItemLabel}>Created: </Text>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      );

    default:
      return (
        <View style={styles.modalItemCard}>
          <Text style={styles.modalItemText}>Unknown item type</Text>
        </View>
      );
  }
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
    borderLeftWidth: 4,
    borderLeftColor: '#6f42c1',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#6f42c1',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  modalItemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
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
  modalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalItemStatus: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalItemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  modalItemLabel: {
    fontWeight: '600',
    color: '#333',
  },
  specialBadge: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyModalState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default AdminDashboard;