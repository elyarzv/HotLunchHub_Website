// Employee Home Screen
// Main screen for employees to view meals and place orders

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { mealService, orderService } from '../../services/supabase';
import CustomButton from '../../components/common/CustomButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CONFIG } from '../../constants/config';

const EmployeeHomeScreen = ({ navigation }) => {
  const { user, getCompanyId } = useAuth();
  
  // State
  const [meals, setMeals] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load meals and recent orders
  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMeals(),
        loadRecentOrders()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load available meals
  const loadMeals = async () => {
    try {
      const mealsData = await mealService.getMeals();
      setMeals(mealsData || []);
    } catch (error) {
      console.error('Error loading meals:', error);
      throw error;
    }
  };

  // Load recent orders for the employee
  const loadRecentOrders = async () => {
    try {
      if (user && user.role === CONFIG.USER_ROLES.EMPLOYEE) {
        const orders = await orderService.getEmployeeOrders(
          user.employee_id || user.id, 
          getCompanyId()
        );
        // Get only the 3 most recent orders
        setRecentOrders(orders ? orders.slice(0, 3) : []);
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
      throw error;
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  // Navigate to order meals screen
  const handleOrderMeals = () => {
    navigation.navigate('EmployeeOrderMeals');
  };

  // Navigate to view all orders
  const handleViewAllOrders = () => {
    navigation.navigate('EmployeeOrders');
  };

  // Navigate to profile
  const handleViewProfile = () => {
    navigation.navigate('EmployeeProfile');
  };

  // Show loading spinner
  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'Employee'}!</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <CustomButton
            title="Order Meals"
            onPress={handleOrderMeals}
            style={styles.actionButton}
            size="large"
          />
          <CustomButton
            title="View Orders"
            onPress={handleViewAllOrders}
            variant="outline"
            style={styles.actionButton}
            size="large"
          />
        </View>
      </View>

      {/* Available Meals Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Meals</Text>
          <TouchableOpacity onPress={handleOrderMeals}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {meals.length > 0 ? (
          <View style={styles.mealsContainer}>
            {meals.slice(0, 3).map((meal) => (
              <View key={meal.meal_id} style={styles.mealCard}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealDescription} numberOfLines={2}>
                    {meal.description || 'No description available'}
                  </Text>
                  <Text style={styles.mealPrice}>${meal.price}</Text>
                </View>
                {meal.is_weekly_special && (
                  <View style={styles.specialBadge}>
                    <Text style={styles.specialText}>Special</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>No meals available at the moment.</Text>
        )}
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={handleViewAllOrders}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentOrders.length > 0 ? (
          <View style={styles.ordersContainer}>
            {recentOrders.map((order) => (
              <View key={order.order_id} style={styles.orderCard}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderMealName}>
                    {order.meals?.name || 'Unknown Meal'}
                  </Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.order_date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.orderStatus}>
                    Status: {order.status}
                  </Text>
                </View>
                <View style={styles.orderQuantity}>
                  <Text style={styles.quantityText}>x{order.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>No recent orders.</Text>
        )}
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <CustomButton
          title="View Profile"
          onPress={handleViewProfile}
          variant="outline"
          style={styles.profileButton}
        />
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
    backgroundColor: '#007AFF',
    padding: 24,
    paddingTop: 40,
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
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  mealsContainer: {
    gap: 12,
  },
  mealCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  mealPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
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
  ordersContainer: {
    gap: 12,
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderMealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  orderQuantity: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
  },
  profileButton: {
    marginTop: 8,
  },
});

export default EmployeeHomeScreen;
