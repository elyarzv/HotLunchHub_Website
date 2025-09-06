import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { supabase } from '../../services/supabase';

const ManageUsers = ({ navigation }) => {
  const [users, setUsers] = useState({
    admins: [],
    drivers: [],
    cooks: [],
    employees: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    admin_code: '',
    employee_code: '',
    company_id: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
  });
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Load all user types in parallel
      const [admins, drivers, cooks, employees] = await Promise.all([
        supabase.from('admins').select('*').order('name'),
        supabase.from('drivers').select('*').order('name'),
        supabase.from('cooks').select('*').order('name'),
        supabase.from('employees').select('*, companies(name)').order('name'),
      ]);

      setUsers({
        admins: admins.data || [],
        drivers: drivers.data || [],
        cooks: cooks.data || [],
        employees: employees.data || [],
      });
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data } = await supabase.from('companies').select('company_id, name').order('name');
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const openAddModal = (role) => {
    console.log('🔍 openAddModal called with role:', role);
    setIsEditing(false);
    setSelectedUser(null);
    const newFormData = {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: role,
      admin_code: '',
      employee_code: '',
      company_id: '',
      address_line1: '',
      address_line2: '',
      city: '',
      postal_code: '',
    };
    console.log('🔍 Setting formData:', newFormData);
    setFormData(newFormData);
    setModalVisible(true);
    console.log('🔍 Modal should now be visible');
  };

  const openEditModal = (user, role) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: role,
      admin_code: user.admin_code || '',
      employee_code: user.employee_code || '',
      company_id: user.company_id || '',
      address_line1: user.address_line1 || '',
      address_line2: user.address_line2 || '',
      city: user.city || '',
      postal_code: user.postal_code || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    console.log('🔍 handleSave called with formData:', formData);
    console.log('🔍 isEditing:', isEditing);
    
    // Validation
    if (!formData.name.trim()) {
      console.log('❌ Validation failed: Name is required');
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!isEditing) {
      // Creating new user
      console.log('🔍 Validating new user creation...');
      
      if (!formData.email.trim()) {
        console.log('❌ Validation failed: Email is required');
        Alert.alert('Error', 'Email is required');
        return;
      }
      if (!formData.password.trim()) {
        console.log('❌ Validation failed: Password is required');
        Alert.alert('Error', 'Password is required');
        return;
      }
      if (formData.password.length < 6) {
        console.log('❌ Validation failed: Password too short');
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        console.log('❌ Validation failed: Passwords do not match');
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (formData.role === 'admin' && !formData.admin_code.trim()) {
        console.log('❌ Validation failed: Admin code is required');
        Alert.alert('Error', 'Admin code is required');
        return;
      }
      if (formData.role === 'employee' && !formData.employee_code.trim()) {
        console.log('❌ Validation failed: Employee code is required');
        Alert.alert('Error', 'Employee code is required');
        return;
      }
      if (formData.role === 'employee' && !formData.company_id) {
        console.log('❌ Validation failed: Company is required');
        Alert.alert('Error', 'Company is required');
        return;
      }
      if (formData.role === 'cook' && !formData.address_line1.trim()) {
        console.log('❌ Validation failed: Address Line 1 is required for cooks');
        Alert.alert('Error', 'Address Line 1 is required for cooks');
        return;
      }
      if (formData.role === 'cook' && !formData.city.trim()) {
        console.log('❌ Validation failed: City is required for cooks');
        Alert.alert('Error', 'City is required for cooks');
        return;
      }
      if (formData.role === 'cook' && !formData.postal_code.trim()) {
        console.log('❌ Validation failed: Postal Code is required for cooks');
        Alert.alert('Error', 'Postal Code is required for cooks');
        return;
      }
      
      console.log('✅ All validations passed');
    }

    try {
      if (isEditing) {
        console.log('🔍 Updating existing user...');
        // Update existing user
        const tableName = getTableName(formData.role);
        const { error } = await supabase
          .from(tableName)
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            ...(formData.role === 'admin' && { admin_code: formData.admin_code }),
            ...(formData.role === 'employee' && { 
              employee_code: formData.employee_code,
              company_id: formData.company_id 
            }),
            ...(formData.role === 'cook' && { 
              address_line1: formData.address_line1,
              address_line2: formData.address_line2,
              city: formData.city,
              postal_code: formData.postal_code
            }),
          })
          .eq('auth_id', selectedUser.auth_id);

        if (error) throw error;
        Alert.alert('Success', 'User updated successfully');
      } else {
        console.log('🔍 Creating new user with role:', formData.role);
        // Create new user
        if (formData.role === 'admin') {
          console.log('🔍 Calling createAdminUser...');
          await createAdminUser();
        } else if (formData.role === 'driver') {
          console.log('🔍 Calling createDriverUser...');
          await createDriverUser();
        } else if (formData.role === 'cook') {
          console.log('🔍 Calling createCookUser...');
          await createCookUser();
        } else if (formData.role === 'employee') {
          console.log('🔍 Calling createEmployeeUser...');
          await createEmployeeUser();
        }
      }

      console.log('✅ User operation completed successfully');
      setModalVisible(false);
      loadUsers();
    } catch (error) {
      console.error('❌ Error in handleSave:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      Alert.alert('Error', error.message || 'Failed to save user');
    }
  };

  const createAdminUser = async () => {
    console.log('🔍 createAdminUser started with data:', {
      email: formData.email,
      name: formData.name,
      admin_code: formData.admin_code,
      phone: formData.phone
    });

    try {
      console.log('🔍 Calling Edge Function to create complete admin user...');
      
      // Get the current session to send with the request
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the Edge Function
      const response = await fetch(`https://aeabhwgmqebozettfelh.supabase.co/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'admin',
          admin_code: formData.admin_code,
          phone: formData.phone,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Admin user created successfully via Edge Function:', result);

      Alert.alert(
        'Success', 
        `Admin user "${formData.name}" created successfully!\n\nEmail: ${formData.email}\nAdmin Code: ${formData.admin_code}\nUser ID: ${result.userId}\n\nUser can now log in with their email and password.`
      );
    } catch (error) {
      console.error('❌ createAdminUser failed:', error);
      
      // Fallback to creating just the admin record
      console.log('🔍 Falling back to creating admin record only...');
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .insert({
            name: formData.name,
            admin_code: formData.admin_code,
            email: formData.email,
            phone: formData.phone,
          })
          .select()
          .single();

        if (adminError) throw adminError;

        console.log('✅ Admin record created successfully (fallback):', adminData);

        Alert.alert(
          'Admin Record Created', 
          `Admin user "${formData.name}" record created successfully!\n\nEmail: ${formData.email}\nAdmin Code: ${formData.admin_code}\n\nNote: The user will need to sign up with this email through the login system to complete the setup.`
        );
      } catch (fallbackError) {
        console.error('❌ Fallback creation also failed:', fallbackError);
        throw fallbackError;
      }
    }
  };

  const createDriverUser = async () => {
    console.log('🔍 createDriverUser started with data:', {
      email: formData.email,
      name: formData.name,
      phone: formData.phone
    });

    try {
      console.log('🔍 Calling Edge Function to create complete driver user...');
      
      // Get the current session to send with the request
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the Edge Function
      const response = await fetch(`https://aeabhwgmqebozettfelh.supabase.co/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'driver',
          phone: formData.phone,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Driver user created successfully via Edge Function:', result);

      Alert.alert(
        'Success', 
        `Driver user "${formData.name}" created successfully!\n\nEmail: ${formData.email}\nUser ID: ${result.userId}\n\nUser can now log in with their email and password.`
      );
    } catch (error) {
      console.error('❌ createDriverUser failed:', error);
      
      // Fallback to creating just the driver record
      console.log('🔍 Falling back to creating driver record only...');
      try {
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          })
          .select()
          .single();

        if (driverError) throw driverError;

        console.log('✅ Driver record created successfully (fallback):', driverData);

        Alert.alert(
          'Driver Record Created', 
          `Driver user "${formData.name}" record created successfully!\n\nEmail: ${formData.email}\n\nNote: The user will need to sign up with this email through the login system to complete the setup.`
        );
      } catch (fallbackError) {
        console.error('❌ Fallback creation also failed:', fallbackError);
        throw fallbackError;
      }
    }
  };

  const createCookUser = async () => {
    console.log('🔍 createCookUser started with data:', {
      email: formData.email,
      name: formData.name,
      phone: formData.phone
    });

    try {
      console.log('🔍 Calling Edge Function to create complete cook user...');
      
      // Get the current session to send with the request
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the Edge Function
      const response = await fetch(`https://aeabhwgmqebozettfelh.supabase.co/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'cook',
          phone: formData.phone,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          postal_code: formData.postal_code,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Cook user created successfully via Edge Function:', result);

      Alert.alert(
        'Success', 
        `Cook user "${formData.name}" created successfully!\n\nEmail: ${formData.email}\nUser ID: ${result.userId}\n\nUser can now log in with their email and password.`
      );
    } catch (error) {
      console.error('❌ createCookUser failed:', error);
      
      // Fallback to creating just the cook record
      console.log('🔍 Falling back to creating cook record only...');
      try {
        const { data: cookData, error: cookError } = await supabase
          .from('cooks')
          .insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2,
            city: formData.city,
            postal_code: formData.postal_code,
          })
          .select()
          .single();

        if (cookError) throw cookError;

        console.log('✅ Cook record created successfully (fallback):', cookData);

        Alert.alert(
          'Cook Record Created', 
          `Cook user "${formData.name}" record created successfully!\n\nEmail: ${formData.email}\n\nNote: The user will need to sign up with this email through the login system to complete the setup.`
        );
      } catch (fallbackError) {
        console.error('❌ Fallback creation also failed:', fallbackError);
        throw fallbackError;
      }
    }
  };

  const createEmployeeUser = async () => {
    console.log('🔍 createEmployeeUser started with data:', {
      email: formData.email,
      name: formData.name,
      employee_code: formData.employee_code,
      company_id: formData.company_id,
      phone: formData.phone
    });

    try {
      console.log('🔍 Calling Edge Function to create complete employee user...');
      
      // Get the current session to send with the request
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the Edge Function
      const response = await fetch(`https://aeabhwgmqebozettfelh.supabase.co/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'employee',
          employee_code: formData.employee_code,
          company_id: formData.company_id,
          phone: formData.phone,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Employee user created successfully via Edge Function:', result);

      const companyName = companies.find(c => c.company_id === formData.company_id)?.name || 'Unknown';

      Alert.alert(
        'Success', 
        `Employee user "${formData.name}" created successfully!\n\nEmail: ${formData.email}\nEmployee Code: ${formData.employee_code}\nCompany: ${companyName}\nUser ID: ${result.userId}\n\nUser can now log in with their email and password.`
      );
    } catch (error) {
      console.error('❌ createEmployeeUser failed:', error);
      
      // Fallback to creating just the employee record
      console.log('🔍 Falling back to creating employee record only...');
      try {
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .insert({
            name: formData.name,
            employee_code: formData.employee_code,
            email: formData.email,
            phone: formData.phone,
            company_id: formData.company_id,
          })
          .select()
          .single();

        if (employeeError) throw employeeError;

        console.log('✅ Employee record created successfully (fallback):', employeeData);

        const companyName = companies.find(c => c.company_id === formData.company_id)?.name || 'Unknown';

        Alert.alert(
          'Employee Record Created', 
          `Employee user "${formData.name}" record created successfully!\n\nEmail: ${formData.email}\nEmployee Code: ${formData.employee_code}\nCompany: ${companyName}\n\nNote: The user will need to sign up with this email through the login system to complete the setup.`
        );
      } catch (fallbackError) {
        console.error('❌ Fallback creation also failed:', fallbackError);
        throw fallbackError;
      }
    }
  };

  const handleDelete = async (user, role) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const tableName = getTableName(role);
              const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('auth_id', user.auth_id);

              if (error) throw error;
              Alert.alert('Success', 'User deleted successfully');
              loadUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const getTableName = (role) => {
    switch (role) {
      case 'admin': return 'admins';
      case 'driver': return 'drivers';
      case 'cook': return 'cooks';
      case 'employee': return 'employees';
      default: return 'admins';
    }
  };

  const renderUserTable = (userList, role, title) => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>{title}</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            console.log('🔍 Add button pressed for role:', role);
            openAddModal(role);
          }}
        >
          <Text style={styles.addButtonText}>+ Add {title.slice(0, -1)}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Name</Text>
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Email</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Phone</Text>
        {role === 'admin' && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Code</Text>}
        {role === 'employee' && <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Company</Text>}
        {role === 'cook' && <Text style={[styles.tableHeaderCell, { flex: 2 }]}>📍 Address</Text>}
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
      </View>

      {userList.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>No {title.toLowerCase()} found</Text>
        </View>
      ) : (
        userList.map((user) => (
          <View key={user.auth_id} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{user.name}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{user.email || '-'}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{user.phone || '-'}</Text>
            {role === 'admin' && (
              <Text style={[styles.tableCell, { flex: 1 }]}>{user.admin_code || '-'}</Text>
            )}
            {role === 'employee' && (
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {user.companies?.name || '-'}
              </Text>
            )}
            {role === 'cook' && (
              <View style={[styles.tableCell, { flex: 2 }]}>
                {user.address_line1 ? (
                  <>
                    <Text style={styles.addressText}>{user.address_line1}</Text>
                    {user.address_line2 && (
                      <Text style={styles.addressSubtext}>{user.address_line2}</Text>
                    )}
                    {(user.city || user.postal_code) && (
                      <Text style={styles.addressSubtext}>
                        {[user.city, user.postal_code].filter(Boolean).join(', ')}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.addressText}>📍 No address set</Text>
                )}
              </View>
            )}
            <View style={[styles.tableCell, { flex: 1, flexDirection: 'row' }]}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => openEditModal(user, role)}
              >
                <Text style={styles.actionButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(user, role)}
              >
                <Text style={styles.actionButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Users...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Wrapper with flex:1 ensures ScrollView knows its height */}
      <View style={styles.scrollWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUsers} />}
          showsVerticalScrollIndicator
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>👥 Manage Users</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Users Content */}
          {renderUserTable(users.admins, 'admin', 'Admins')}
          {renderUserTable(users.drivers, 'driver', 'Drivers')}
          {renderUserTable(users.cooks, 'cook', 'Cooks')}
          {renderUserTable(users.employees, 'employee', 'Employees')}
        </ScrollView>
      </View>

      {/* Add/Edit User Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit User' : 'Add New User'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isEditing} // Email cannot be changed when editing
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            {!isEditing && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Password * (min 6 characters)"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                  autoCapitalize="none"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password *"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </>
            )}

            {formData.role === 'admin' && (
              <TextInput
                style={styles.input}
                placeholder="Admin Code *"
                value={formData.admin_code}
                onChangeText={(text) => setFormData({ ...formData, admin_code: text })}
              />
            )}

            {formData.role === 'employee' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Employee Code *"
                  value={formData.employee_code}
                  onChangeText={(text) => setFormData({ ...formData, employee_code: text })}
                />
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Company *:</Text>
                  <ScrollView style={styles.picker}>
                    {companies.map((company) => (
                      <TouchableOpacity
                        key={company.company_id}
                        style={[
                          styles.pickerOption,
                          formData.company_id === company.company_id && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, company_id: company.company_id })}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          formData.company_id === company.company_id && styles.pickerOptionTextSelected
                        ]}>
                          {company.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}

            {formData.role === 'cook' && (
              <>
                <Text style={styles.sectionTitle}>📍 Address Information (Required for Cooks)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Address Line 1 *"
                  value={formData.address_line1}
                  onChangeText={(text) => setFormData({ ...formData, address_line1: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Address Line 2 (Optional)"
                  value={formData.address_line2}
                  onChangeText={(text) => setFormData({ ...formData, address_line2: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="City *"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Postal Code *"
                  value={formData.postal_code}
                  onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
                  keyboardType="numeric"
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  console.log('🔍 Save button pressed!');
                  console.log('🔍 Current formData:', formData);
                  handleSave();
                }}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update' : 'Create User'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  scrollWrapper: {
    flex: 1,
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
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6f42c1',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyRow: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actionButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  deleteButton: {
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  picker: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionSelected: {
    backgroundColor: '#6f42c1',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  pickerOptionTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  saveButton: {
    backgroundColor: '#6f42c1',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  addressSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ManageUsers;
