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

const AdminCompaniesScreen = ({ navigation }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    lunch_time: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      Alert.alert('Error', 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedCompany(null);
    setFormData({
      name: '',
      logo_url: '',
      lunch_time: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (company) => {
    setIsEditing(true);
    setSelectedCompany(company);
    setFormData({
      name: company.name || '',
      logo_url: company.logo_url || '',
      lunch_time: company.lunch_time || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Company name is required');
      return;
    }
    if (!formData.lunch_time.trim()) {
      Alert.alert('Error', 'Lunch time is required');
      return;
    }

    try {
      if (isEditing) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            logo_url: formData.logo_url,
            lunch_time: formData.lunch_time,
            updated_at: new Date(),
          })
          .eq('company_id', selectedCompany.company_id);

        if (error) throw error;
        Alert.alert('Success', 'Company updated successfully');
      } else {
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            logo_url: formData.logo_url,
            lunch_time: formData.lunch_time,
          });

        if (error) throw error;
        Alert.alert('Success', 'Company created successfully');
      }

      setModalVisible(false);
      loadCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      Alert.alert('Error', error.message || 'Failed to save company');
    }
  };

  const deleteCompany = async (companyId) => {
    console.log('deleteCompany function called with ID:', companyId);
    console.log('Platform.OS:', Platform.OS);
    console.log('typeof window:', typeof window);
    console.log('window.confirm available:', typeof window.confirm);
    
    const performDelete = async () => {
      try {
        console.log('Attempting to delete company with ID:', companyId);
              
              // Check if company has any employees first
              const { data: employees, error: employeesError } = await supabase
                .from('employees')
                .select('employee_id')
                .eq('company_id', companyId);
              
              if (employeesError) {
                console.error('Error checking employees:', employeesError);
                throw employeesError;
              }
              
              if (employees && employees.length > 0) {
                Alert.alert(
                  'Cannot Delete', 
                  `This company has ${employees.length} employee(s) and cannot be deleted. Please reassign or delete the employees first.`
                );
                return;
              }
              
              // Check if company has any orders
              const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('order_id')
                .eq('company_id', companyId);
              
              if (ordersError) {
                console.error('Error checking orders:', ordersError);
                throw ordersError;
              }
              
              if (orders && orders.length > 0) {
                Alert.alert(
                  'Cannot Delete', 
                  `This company has ${orders.length} order(s) and cannot be deleted. Please delete the orders first.`
                );
                return;
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
                  recordId: companyId,
                  recordType: 'company',
                  authId: null // Companies don't have auth_id
                })
              });

              const result = await response.json();

              if (!result.success) {
                throw new Error(result.error || 'Failed to delete company');
              }
              
        console.log('Company deleted successfully');
        if (Platform.OS === 'web') {
          alert('Company deleted successfully');
        } else {
          Alert.alert('Success', 'Company deleted successfully');
        }
        loadCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
        if (Platform.OS === 'web') {
          alert(`Failed to delete company: ${error.message || 'Unknown error'}`);
        } else {
          Alert.alert(
            'Error', 
            `Failed to delete company: ${error.message || 'Unknown error'}`
          );
        }
      }
    };
    
    // Try web confirm first, then fallback to Alert.alert
    try {
      if (typeof window !== 'undefined' && window.confirm) {
        console.log('Using web confirm dialog for company');
        const confirmed = window.confirm('Are you sure you want to delete this company? This action cannot be undone.');
        console.log('User confirmed company deletion:', confirmed);
        if (confirmed) {
          await performDelete();
        } else {
          console.log('Company delete cancelled by user');
        }
      } else {
        throw new Error('window.confirm not available');
      }
    } catch (error) {
      console.log('Web confirm failed for company, falling back to Alert.alert:', error);
      // Fallback to Alert.alert
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this company? This action cannot be undone.',
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

  const renderCompanyCards = () => {
    return (
      <View style={styles.companiesContainer}>
        <View style={styles.companiesHeader}>
          <Text style={styles.companiesTitle}>🏢 Companies ({companies.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add Company</Text>
          </TouchableOpacity>
        </View>
        
        {companies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No companies available</Text>
            <Text style={styles.emptySubtext}>Create your first company to get started</Text>
          </View>
        ) : (
          <View style={styles.companiesGrid}>
            {companies.map((company) => (
              <View key={company.company_id} style={styles.companyCard}>
                {/* Company Details */}
                <View style={styles.companyDetails}>
                  <Text style={styles.companyName}>{company.name}</Text>
                  <Text style={styles.companyLunchTime}>🍽️ Lunch Time: {company.lunch_time || 'Not set'}</Text>
                  {company.logo_url && (
                    <Text style={styles.companyLogo}>🖼️ Logo: {company.logo_url}</Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.companyActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(company)}
                  >
                    <Text style={styles.editButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      console.log('Delete button clicked for company ID:', company.company_id);
                      deleteCompany(company.company_id);
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
          <Text style={styles.loadingText}>Loading companies...</Text>
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
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCompanies} />}
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
                <Text style={styles.headerTitle}>🏢 Manage Companies</Text>
                <Text style={styles.headerSubtitle}>Add, edit, and manage company information</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Companies Content */}
          {renderCompanyCards()}
        </ScrollView>
      </View>

      {/* Add/Edit Company Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Company' : 'Add New Company'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Company Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Logo URL (Optional)"
              value={formData.logo_url}
              onChangeText={(text) => setFormData({ ...formData, logo_url: text })}
              keyboardType="url"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Lunch Time * (e.g., 12:00:00)"
              value={formData.lunch_time}
              onChangeText={(text) => setFormData({ ...formData, lunch_time: text })}
            />

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
                  {isEditing ? 'Update' : 'Create Company'}
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
  companiesContainer: {
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
  companiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  companiesTitle: {
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
  companiesGrid: {
    padding: 16,
  },
  companyCard: {
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
  companyDetails: {
    marginBottom: 12,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  companyLunchTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  companyLogo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  companyActions: {
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

export default AdminCompaniesScreen;
