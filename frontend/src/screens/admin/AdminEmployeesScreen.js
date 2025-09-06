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
import { CONFIG } from '../../constants/config';

const AdminEmployeesScreen = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    employee_code: '',
    email: '',
    phone: '',
    company_id: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadEmployees();
    loadCompanies();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          companies!inner(name)
        `)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedEmployee(null);
    setFormData({
      name: '',
      employee_code: '',
      email: '',
      phone: '',
      company_id: '',
      password: '',
      confirmPassword: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (employee) => {
    setIsEditing(true);
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name || '',
      employee_code: employee.employee_code || '',
      email: employee.email || '',
      phone: employee.phone || '',
      company_id: employee.company_id || '',
      password: '',
      confirmPassword: '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Employee name is required');
      return;
    }
    if (!formData.employee_code.trim()) {
      Alert.alert('Error', 'Employee code is required');
      return;
    }
    if (!formData.company_id) {
      Alert.alert('Error', 'Company selection is required');
      return;
    }

    // Password validation for new employees
    if (!isEditing) {
      if (!formData.email.trim()) {
        Alert.alert('Error', 'Email is required for new employees');
        return;
      }
      if (!formData.password.trim()) {
        Alert.alert('Error', 'Password is required for new employees');
        return;
      }
      if (formData.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    try {
      if (isEditing) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update({
            name: formData.name,
            employee_code: formData.employee_code,
            email: formData.email,
            phone: formData.phone,
            company_id: parseInt(formData.company_id),
            updated_at: new Date(),
          })
          .eq('employee_id', selectedEmployee.employee_id);

        if (error) throw error;
        Alert.alert('Success', 'Employee updated successfully');
      } else {
        // Create new employee with user account
        await createEmployeeUser();
      }

      setModalVisible(false);
      loadEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      Alert.alert('Error', error.message || 'Failed to save employee');
    }
  };

  const createEmployeeUser = async () => {
    console.log('🔍 createEmployeeUser started with data:', {
      email: formData.email,
      name: formData.name,
      employee_code: formData.employee_code,
      company_id: formData.company_id
    });

    try {
      console.log('🔍 Calling Edge Function to create complete employee user...');
      
      // Get company name for display
      const company = companies.find(c => c.company_id === parseInt(formData.company_id));
      const companyName = company ? company.name : 'Unknown Company';

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
          phone: formData.phone,
          company_id: parseInt(formData.company_id),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Employee user created successfully via Edge Function:', result);

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
            company_id: parseInt(formData.company_id),
          })
          .select()
          .single();

        if (employeeError) throw employeeError;

        console.log('✅ Employee record created successfully (fallback):', employeeData);

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

  const deleteEmployee = async (employeeId) => {
    console.log('deleteEmployee function called with ID:', employeeId);
    console.log('Platform.OS:', Platform.OS);
    console.log('typeof window:', typeof window);
    console.log('window.confirm available:', typeof window.confirm);
    
    const performDelete = async () => {
      try {
        console.log('Attempting to delete employee with ID:', employeeId);
              
              // Check if employee has any orders first
              const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('order_id')
                .eq('employee_id', employeeId);
              
              if (ordersError) {
                console.error('Error checking orders:', ordersError);
                throw ordersError;
              }
              
              if (orders && orders.length > 0) {
                Alert.alert(
                  'Cannot Delete', 
                  `This employee has ${orders.length} order(s) and cannot be deleted. Please delete the orders first.`
                );
                return;
              }

              // Get the employee's auth_id first
              const { data: employee, error: fetchError } = await supabase
                .from('employees')
                .select('auth_id')
                .eq('employee_id', employeeId)
                .single();

              if (fetchError) {
                console.error('Error fetching employee auth_id:', fetchError);
                throw fetchError;
              }

              if (!employee?.auth_id) {
                throw new Error('Employee auth_id not found');
              }

              // Get current session for authorization
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) {
                throw new Error('No active session');
              }

              // Call the delete-user edge function
              const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/delete-user`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  recordId: employeeId,
                  recordType: 'employee',
                  authId: employee.auth_id
                })
              });

              const result = await response.json();

              if (!result.success) {
                throw new Error(result.error || 'Failed to delete employee');
              }
              
        console.log('Employee deleted successfully');
        if (Platform.OS === 'web') {
          alert('Employee deleted successfully');
        } else {
          Alert.alert('Success', 'Employee deleted successfully');
        }
        loadEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        if (Platform.OS === 'web') {
          alert(`Failed to delete employee: ${error.message || 'Unknown error'}`);
        } else {
          Alert.alert(
            'Error', 
            `Failed to delete employee: ${error.message || 'Unknown error'}`
          );
        }
      }
    };
    
    // Try web confirm first, then fallback to Alert.alert
    try {
      if (typeof window !== 'undefined' && window.confirm) {
        console.log('Using web confirm dialog for employee');
        const confirmed = window.confirm('Are you sure you want to delete this employee? This action cannot be undone.');
        console.log('User confirmed employee deletion:', confirmed);
        if (confirmed) {
          await performDelete();
        } else {
          console.log('Employee delete cancelled by user');
        }
      } else {
        throw new Error('window.confirm not available');
      }
    } catch (error) {
      console.log('Web confirm failed for employee, falling back to Alert.alert:', error);
      // Fallback to Alert.alert
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this employee? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const renderEmployeeCards = () => {
    return (
      <View style={styles.employeesContainer}>
        <View style={styles.employeesHeader}>
          <Text style={styles.employeesTitle}>👥 Employees ({employees.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add Employee</Text>
          </TouchableOpacity>
        </View>
        
        {employees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No employees available</Text>
            <Text style={styles.emptySubtext}>Create your first employee to get started</Text>
          </View>
        ) : (
          <View style={styles.employeesGrid}>
            {employees.map((employee) => (
              <View key={employee.employee_id} style={styles.employeeCard}>
                {/* Employee Details */}
                <View style={styles.employeeDetails}>
                  <Text style={styles.employeeName}>{employee.name}</Text>
                  <Text style={styles.employeeCode}>#{employee.employee_code}</Text>
                  <Text style={styles.employeeEmail}>📧 {employee.email || 'No email'}</Text>
                  <Text style={styles.employeePhone}>📞 {employee.phone || 'No phone'}</Text>
                  <Text style={styles.employeeCompany}>🏢 {employee.companies?.name || 'Unknown Company'}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.employeeActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(employee)}
                  >
                    <Text style={styles.editButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      console.log('Delete button clicked for employee ID:', employee.employee_id);
                      deleteEmployee(employee.employee_id);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading employees...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Wrapper with flex:1 ensures ScrollView knows its height */}
      <View style={styles.scrollWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEmployees} />}
          showsVerticalScrollIndicator
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>👥 Manage Employees</Text>
                <Text style={styles.headerSubtitle}>Add, edit, and manage employee information</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Employees Content */}
          {renderEmployeeCards()}
        </ScrollView>
      </View>

      {/* Add/Edit Employee Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Employee' : 'Add New Employee'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Employee Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Employee Code *"
              value={formData.employee_code}
              onChangeText={(text) => setFormData({ ...formData, employee_code: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email (Optional)"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone (Optional)"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            {/* Password fields for new employees */}
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

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update' : 'Create Employee'}
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
    backgroundColor: '#f8f9fa',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    flex: Platform.OS === 'web' ? undefined : 1,
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  employeesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
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
  employeesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  employeesTitle: {
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
  employeesGrid: {
    padding: 16,
  },
  employeeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  employeeDetails: {
    marginBottom: 12,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  employeeCode: {
    fontSize: 14,
    color: '#6f42c1',
    fontWeight: '600',
    marginBottom: 8,
  },
  employeeEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  employeePhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  employeeCompany: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  employeeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 500,
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  picker: {
    maxHeight: 120,
  },
  pickerOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  pickerOptionSelected: {
    backgroundColor: '#6f42c1',
    borderColor: '#6f42c1',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminEmployeesScreen;
