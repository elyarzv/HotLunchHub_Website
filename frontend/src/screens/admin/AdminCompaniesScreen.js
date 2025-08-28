// Admin Companies Screen
// Comprehensive company management for administrators
// Allows adding, editing, and managing company information

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
import { supabase } from '../../services/supabase';
import CustomButton from '../../components/common/CustomButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminCompaniesScreen = ({ navigation }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newCompany, setNewCompany] = useState({
    name: '',
    logo_url: '',
    lunch_time: '12:00',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      Alert.alert('Error', 'Failed to load companies: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompany.name || !newCompany.lunch_time) {
      Alert.alert('Validation Error', 'Please fill in company name and lunch time');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          name: newCompany.name,
          logo_url: newCompany.logo_url || '',
          lunch_time: newCompany.lunch_time,
        }])
        .select()
        .single();

      if (error) throw error;

      setCompanies([data, ...companies]);
      setShowAddCompanyModal(false);
      resetNewCompanyForm();
      
      Alert.alert('Success', 'Company added successfully!');
    } catch (error) {
      console.error('Error adding company:', error);
      Alert.alert('Error', 'Failed to add company: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = async () => {
    if (!editingCompany.name || !editingCompany.lunch_time) {
      Alert.alert('Validation Error', 'Please fill in company name and lunch time');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('companies')
        .update({
          name: editingCompany.name,
          logo_url: editingCompany.logo_url || '',
          lunch_time: editingCompany.lunch_time,
        })
        .eq('company_id', editingCompany.company_id)
        .select()
        .single();

      if (error) throw error;

      setCompanies(companies.map(company => 
        company.company_id === editingCompany.company_id ? data : company
      ));
      setEditingCompany(null);
      
      Alert.alert('Success', 'Company updated successfully!');
    } catch (error) {
      console.error('Error updating company:', error);
      Alert.alert('Error', 'Failed to update company: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = (companyId) => {
    Alert.alert(
      'Delete Company',
      'Are you sure you want to delete this company? This will also delete all associated employees and orders.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('companies')
                .delete()
                .eq('company_id', companyId);

              if (error) throw error;
              
              setCompanies(companies.filter(company => company.company_id !== companyId));
              Alert.alert('Success', 'Company deleted successfully');
            } catch (error) {
              console.error('Error deleting company:', error);
              Alert.alert('Error', 'Failed to delete company: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const resetNewCompanyForm = () => {
    setNewCompany({
      name: '',
      logo_url: '',
      lunch_time: '12:00',
    });
  };

  const startEditCompany = (company) => {
    setEditingCompany({
      company_id: company.company_id,
      name: company.name,
      logo_url: company.logo_url || '',
      lunch_time: company.lunch_time,
    });
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && companies.length === 0) {
    return <LoadingSpinner text="Loading companies..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>🏢 Company Management</Text>
            <Text style={styles.subtitle}>Manage company information and settings</Text>
          </View>
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => navigation.navigate('AdminHome')}
          >
            <Text style={styles.homeButtonText}>🏠 Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search companies by name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Add Company Button */}
        <View style={styles.addCompanySection}>
          <CustomButton
            title="➕ Add New Company"
            onPress={() => setShowAddCompanyModal(true)}
            style={styles.addCompanyButton}
            size="large"
          />
        </View>

        {/* Companies List */}
        <View style={styles.companiesList}>
          {filteredCompanies.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏢</Text>
              <Text style={styles.emptyStateText}>No companies found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery 
                  ? 'Try adjusting your search'
                  : 'Start by adding your first company'
                }
              </Text>
            </View>
          ) : (
            filteredCompanies.map(company => (
              <View key={company.company_id} style={styles.companyCard}>
                <View style={styles.companyHeader}>
                  <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <Text style={styles.lunchTime}>Lunch Time: {company.lunch_time}</Text>
                  </View>
                  
                  <View style={styles.companyActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => startEditCompany(company)}
                    >
                      <Text style={styles.actionButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteCompany(company.company_id)}
                    >
                      <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {company.logo_url && (
                  <Text style={styles.logoUrl}>Logo: {company.logo_url}</Text>
                )}
                
                <Text style={styles.companyDate}>
                  Created: {new Date(company.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Company Modal */}
      <Modal
        visible={showAddCompanyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Company</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddCompanyModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Company Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter company name"
                  value={newCompany.name}
                  onChangeText={(text) => setNewCompany({...newCompany, name: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Logo URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/logo.png (optional)"
                  value={newCompany.logo_url}
                  onChangeText={(text) => setNewCompany({...newCompany, logo_url: text})}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Lunch Time *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12:00"
                  value={newCompany.lunch_time}
                  onChangeText={(text) => setNewCompany({...newCompany, lunch_time: text})}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                onPress={() => setShowAddCompanyModal(false)}
                style={styles.cancelButton}
                size="large"
              />
              <CustomButton
                title="Add Company"
                onPress={handleAddCompany}
                loading={loading}
                disabled={loading}
                style={styles.addButton}
                size="large"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        visible={!!editingCompany}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Company</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEditingCompany(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Company Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter company name"
                  value={editingCompany?.name}
                  onChangeText={(text) => setEditingCompany({...editingCompany, name: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Logo URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/logo.png (optional)"
                  value={editingCompany?.logo_url}
                  onChangeText={(text) => setEditingCompany({...editingCompany, logo_url: text})}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Lunch Time *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12:00"
                  value={editingCompany?.lunch_time}
                  onChangeText={(text) => setEditingCompany({...editingCompany, lunch_time: text})}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                onPress={() => setEditingCompany(null)}
                style={styles.cancelButton}
                size="large"
              />
              <CustomButton
                title="Update Company"
                onPress={handleEditCompany}
                loading={loading}
                disabled={loading}
                style={styles.updateButton}
                size="large"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  homeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
  },
  homeButtonText: {
    fontSize: 14,
    color: '#6f42c1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6f42c1',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  addCompanySection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  addCompanyButton: {
    backgroundColor: '#28a745',
  },
  companiesList: {
    padding: 16,
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
  companyCard: {
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
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lunchTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  companyActions: {
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
  logoUrl: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  companyDate: {
    fontSize: 12,
    color: '#999',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
  },
  addButton: {
    flex: 2,
    backgroundColor: '#28a745',
  },
  updateButton: {
    flex: 2,
    backgroundColor: '#007AFF',
  },
});

export default AdminCompaniesScreen;
