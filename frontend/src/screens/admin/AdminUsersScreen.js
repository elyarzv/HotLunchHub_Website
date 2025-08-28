// Admin Users Screen
// Comprehensive user management for administrators
// Allows adding, editing, and managing users across all role tables

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/common/CustomButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CONFIG } from '../../constants/config';
import userService from '../../services/userService';

const AdminUsersScreen = () => {
  const { user } = useAuth();
  
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('employee');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [error, setError] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'employee',
    company_id: '',
    // Role-specific fields
    employee_fields: {
      department: '',
      position: '',
      employee_id: '',
    },
    cook_fields: {
      kitchen_location: '',
      specialty: '',
      experience_years: '',
    },
    driver_fields: {
      vehicle_type: '',
      license_number: '',
      delivery_zone: '',
    },
  });

  // Available roles for user creation
  const availableRoles = [
    { id: 'employee', label: 'Employee', icon: '👨‍💼', color: '#007AFF' },
    { id: 'cook', label: 'Kitchen Staff', icon: '👨‍🍳', color: '#ff6b35' },
    { id: 'driver', label: 'Delivery Driver', icon: '🚚', color: '#28a745' },
    { id: 'admin', label: 'Administrator', icon: '👑', color: '#6f42c1', requiresAdmin: true },
  ];

  // Mock data for demonstration (replace with real API calls)
  const mockUsers = [
    {
      id: '1',
      email: 'john.doe@company.com',
      full_name: 'John Doe',
      role: 'employee',
      department: 'Engineering',
      position: 'Software Developer',
      status: 'active',
      created_at: '2024-01-15',
    },
    {
      id: '2',
      email: 'chef.maria@company.com',
      full_name: 'Maria Garcia',
      role: 'cook',
      kitchen_location: 'Main Kitchen',
      specialty: 'Italian Cuisine',
      status: 'active',
      created_at: '2024-01-10',
    },
    {
      id: '3',
      email: 'driver.mike@company.com',
      full_name: 'Mike Johnson',
      role: 'driver',
      vehicle_type: 'Van',
      delivery_zone: 'Downtown',
      status: 'active',
      created_at: '2024-01-12',
    },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      if (response.error) {
        throw new Error(response.error);
      }
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    setError(null); // Clear previous errors
    
    // Validate form
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Password validation
    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      const userDataToCreate = {
        ...newUser,
        role: selectedRole
      };
      console.log('Creating user with data:', userDataToCreate);
      const response = await userService.createUser(userDataToCreate);
      if (response.error) {
        throw new Error(response.error);
      }
      setUsers([...users, response.data]);
      setShowAddUserModal(false);
      resetNewUserForm();
      if (response.warning) {
        Alert.alert('Success with Note', response.warning);
      } else {
        Alert.alert('Success', 'User created successfully!');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      // Try to extract more specific error information
      let errorMessage = error.message || 'Failed to create user. Please try again.';
      
      if (error.message && error.message.includes('Email address')) {
        errorMessage = `Email validation failed: ${error.message}. This might be due to Supabase settings.`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRoleSpecificFields = (role) => {
    switch (role) {
      case 'employee':
        return {
          department: newUser.employee_fields.department,
          position: newUser.employee_fields.position,
        };
      case 'cook':
        return {
          kitchen_location: newUser.cook_fields.kitchen_location,
          specialty: newUser.cook_fields.specialty,
        };
      case 'driver':
        return {
          vehicle_type: newUser.driver_fields.vehicle_type,
          delivery_zone: newUser.driver_fields.delivery_zone,
        };
      default:
        return {};
    }
  };

  const resetNewUserForm = () => {
    setNewUser({
      email: '',
      password: '',
      full_name: '',
      role: 'employee',
      company_id: '',
      employee_fields: { department: '', position: '', employee_id: '' },
      cook_fields: { kitchen_location: '', specialty: '', experience_years: '' },
      driver_fields: { vehicle_type: '', license_number: '', delivery_zone: '' },
    });
  };

  const handleDeleteUser = (userId) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
                     onPress: async () => {
             try {
               const response = await userService.deleteUser(userId);
               if (response.error) {
                 throw new Error(response.error);
               }
               
               setUsers(users.filter(user => user.id !== userId));
               Alert.alert('Success', 'User deleted successfully');
             } catch (error) {
               console.error('Error deleting user:', error);
               Alert.alert('Error', 'Failed to delete user: ' + error.message);
             }
           },
        },
      ]
    );
  };

  const handleEditUser = (user) => {
    // TODO: Implement edit user functionality
    Alert.alert('Edit User', `Edit functionality for ${user.full_name} will be implemented next`);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    const roleData = availableRoles.find(r => r.id === role);
    return roleData ? roleData.icon : '👤';
  };

  const getRoleColor = (role) => {
    const roleData = availableRoles.find(r => r.id === role);
    return roleData ? roleData.color : '#666';
  };

  if (loading && users.length === 0) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>👥 User Management</Text>
              <Text style={styles.subtitle}>Manage all system users</Text>
            </View>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={() => {
                // Navigate back to admin home where sign out is available
                navigation.navigate('AdminHome');
              }}
            >
              <Text style={styles.signOutButtonText}>🏠 Home</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchFilterBar}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter by role:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filterRole === 'all' && styles.filterChipActive
                ]}
                onPress={() => setFilterRole('all')}
              >
                <Text style={[
                  styles.filterChipText,
                  filterRole === 'all' && styles.filterChipTextActive
                ]}>All</Text>
              </TouchableOpacity>
              {availableRoles.map(role => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.filterChip,
                    filterRole === role.id && styles.filterChipActive
                  ]}
                  onPress={() => setFilterRole(role.id)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filterRole === role.id && styles.filterChipTextActive
                  ]}>{role.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Add User Buttons */}
        <View style={styles.addUserSection}>
          {/* Debug info */}
          <Text style={styles.debugText}>Modal State: {showAddUserModal ? 'OPEN' : 'CLOSED'}</Text>
          
          <View style={styles.buttonRow}>
            <CustomButton
              title="➕ Add New User"
              onPress={() => {
                console.log('🔘 Add New User button pressed');
                console.log('🔍 Current modal state:', showAddUserModal);
                setShowAddUserModal(true);
                console.log('🔍 Modal state after set:', true);
              }}
              style={styles.addUserButton}
              size="large"
            />
            <CustomButton
              title="👑 Create Admin"
              onPress={() => navigation.navigate('AdminCreateAdmin')}
              style={styles.createAdminButton}
              size="large"
            />
          </View>
          
          {/* Test button */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              console.log('🧪 Test button pressed');
              setShowAddUserModal(!showAddUserModal);
            }}
          >
            <Text style={styles.testButtonText}>🧪 Test Modal Toggle</Text>
          </TouchableOpacity>
        </View>

        {/* Users List */}
        <View style={styles.usersList}>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>👥</Text>
              <Text style={styles.emptyStateText}>No users found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery || filterRole !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first user'
                }
              </Text>
            </View>
          ) : (
            filteredUsers.map(user => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userIcon}>{getRoleIcon(user.role)}</Text>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{user.full_name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <View style={styles.userRoleContainer}>
                        <Text style={[
                          styles.userRole,
                          { color: getRoleColor(user.role) }
                        ]}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: user.status === 'active' ? '#28a745' : '#dc3545' }
                        ]}>
                          <Text style={styles.statusText}>
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditUser(user)}
                    >
                      <Text style={styles.actionButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteUser(user.id)}
                    >
                      <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Role-specific details */}
                <View style={styles.userDetails}>
                  {user.department && (
                    <Text style={styles.detailText}>Department: {user.department}</Text>
                  )}
                  {user.position && (
                    <Text style={styles.detailText}>Position: {user.position}</Text>
                  )}
                  {user.kitchen_location && (
                    <Text style={styles.detailText}>Kitchen: {user.kitchen_location}</Text>
                  )}
                  {user.specialty && (
                    <Text style={styles.detailText}>Specialty: {user.specialty}</Text>
                  )}
                  {user.vehicle_type && (
                    <Text style={styles.detailText}>Vehicle: {user.vehicle_type}</Text>
                  )}
                  {user.delivery_zone && (
                    <Text style={styles.detailText}>Zone: {user.delivery_zone}</Text>
                  )}
                  <Text style={styles.detailText}>Created: {user.created_at}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      {showAddUserModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New User</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  console.log('❌ Close button pressed');
                  setShowAddUserModal(false);
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Basic Information */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    value={newUser.full_name}
                    onChangeText={(text) => setNewUser({...newUser, full_name: text})}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="user@company.com"
                    value={newUser.email}
                    onChangeText={(text) => setNewUser({...newUser, email: text})}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    value={newUser.password}
                    onChangeText={(text) => setNewUser({...newUser, password: text})}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Role *</Text>
                  <View style={styles.roleSelector}>
                    {availableRoles.map(role => (
                      <TouchableOpacity
                        key={role.id}
                        style={[
                          styles.roleOption,
                          selectedRole === role.id && styles.roleOptionActive
                        ]}
                        onPress={() => setSelectedRole(role.id)}
                      >
                        <Text style={styles.roleOptionIcon}>{role.icon}</Text>
                        <Text style={[
                          styles.roleOptionText,
                          selectedRole === role.id && styles.roleOptionTextActive
                        ]}>
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Company ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter company ID (optional)"
                    value={newUser.company_id}
                    onChangeText={(text) => setNewUser({...newUser, company_id: text})}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Role-specific fields */}
              {selectedRole === 'employee' && (
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Employee Details</Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Department</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Engineering, Sales, HR"
                      value={newUser.employee_fields.department}
                      onChangeText={(text) => setNewUser({
                        ...newUser,
                        employee_fields: {...newUser.employee_fields, department: text}
                      })}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Position</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Software Developer, Manager"
                      value={newUser.employee_fields.position}
                      onChangeText={(text) => setNewUser({
                        ...newUser,
                        employee_fields: {...newUser.employee_fields, position: text}
                      })}
                    />
                  </View>
                </View>
              )}

              {selectedRole === 'cook' && (
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Kitchen Staff Details</Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Kitchen Location</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Main Kitchen, Food Court"
                      value={newUser.cook_fields.kitchen_location}
                      onChangeText={(text) => setNewUser({
                        ...newUser,
                        cook_fields: {...newUser.cook_fields, kitchen_location: text}
                      })}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Specialty</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Italian, Asian, Desserts"
                      value={newUser.cook_fields.specialty}
                      onChangeText={(text) => setNewUser({
                        ...newUser,
                        cook_fields: {...newUser.cook_fields, specialty: text}
                      })}
                    />
                  </View>
                </View>
              )}

              {selectedRole === 'driver' && (
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Driver Details</Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Vehicle Type</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Van, Car, Motorcycle"
                      value={newUser.driver_fields.vehicle_type}
                      onChangeText={(text) => setNewUser({
                        ...newUser,
                        driver_fields: {...newUser.driver_fields, vehicle_type: text}
                      })}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Delivery Zone</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Downtown, North Area"
                      value={newUser.driver_fields.delivery_zone}
                      onChangeText={(text) => setNewUser({
                        ...newUser,
                        driver_fields: {...newUser.driver_fields, delivery_zone: text}
                      })}
                    />
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <CustomButton
                  title="Cancel"
                  onPress={() => setShowAddUserModal(false)}
                  style={styles.cancelButton}
                  size="large"
                />
                <CustomButton
                  title="Create User"
                  onPress={handleAddUser}
                  loading={loading}
                  disabled={loading}
                  style={styles.createButton}
                  size="large"
                />
              </View>
              
              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>❌ {error}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  signOutButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  searchFilterBar: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#333',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  addUserSection: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  addUserButton: {
    flex: 1,
    backgroundColor: '#28a745',
  },
  createAdminButton: {
    flex: 1,
    backgroundColor: '#6f42c1',
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  testButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  usersList: {
    padding: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  userIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 100,
    justifyContent: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleOptionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
  },
  createButton: {
    flex: 2,
    backgroundColor: '#28a745',
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AdminUsersScreen;
