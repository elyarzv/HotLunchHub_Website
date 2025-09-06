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

const AdminCooksScreen = ({ navigation }) => {
  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCook, setSelectedCook] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadCooks();
  }, []);

  const loadCooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cooks')
        .select('*')
        .order('name');

      if (error) throw error;
      setCooks(data || []);
    } catch (error) {
      console.error('Error loading cooks:', error);
      Alert.alert('Error', 'Failed to load cooks');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedCook(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      postal_code: '',
      password: '',
      confirmPassword: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (cook) => {
    setIsEditing(true);
    setSelectedCook(cook);
    setFormData({
      name: cook.name || '',
      email: cook.email || '',
      phone: cook.phone || '',
      address_line1: cook.address_line1 || '',
      address_line2: cook.address_line2 || '',
      city: cook.city || '',
      postal_code: cook.postal_code || '',
      password: '',
      confirmPassword: '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Cook name is required');
      return;
    }

    // Password validation for new cooks
    if (!isEditing) {
      if (!formData.email.trim()) {
        Alert.alert('Error', 'Email is required for new cooks');
        return;
      }
      if (!formData.password.trim()) {
        Alert.alert('Error', 'Password is required for new cooks');
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
        // Update existing cook
        const { error } = await supabase
          .from('cooks')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2,
            city: formData.city,
            postal_code: formData.postal_code,
            updated_at: new Date(),
          })
          .eq('cook_id', selectedCook.cook_id);

        if (error) throw error;
        Alert.alert('Success', 'Cook updated successfully');
      } else {
        // Create new cook with user account
        await createCookUser();
      }

      setModalVisible(false);
      loadCooks();
    } catch (error) {
      console.error('Error saving cook:', error);
      Alert.alert('Error', error.message || 'Failed to save cook');
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

  const deleteCook = async (cookId) => {
    console.log('deleteCook function called with ID:', cookId);
    console.log('Platform.OS:', Platform.OS);
    console.log('typeof window:', typeof window);
    console.log('window.confirm available:', typeof window.confirm);
    
    const performDelete = async () => {
      try {
        console.log('Attempting to delete cook with ID:', cookId);
        
        // Check if cook has any meals first
        console.log('Checking for meals...');
        const { data: meals, error: mealsError } = await supabase
          .from('meals')
          .select('meal_id')
          .eq('cook_id', cookId);
        
        console.log('Meals check result:', { meals, mealsError });
        
        if (mealsError) {
          console.error('Error checking meals:', mealsError);
          throw mealsError;
        }
        
        if (meals && meals.length > 0) {
          console.log(`Cook has ${meals.length} meals, cannot delete`);
          if (Platform.OS === 'web') {
            alert(`This cook has ${meals.length} meal(s) and cannot be deleted. Please delete the meals first.`);
          } else {
            Alert.alert(
              'Cannot Delete', 
              `This cook has ${meals.length} meal(s) and cannot be deleted. Please delete the meals first.`
            );
          }
          return;
        }

        // Get the cook's auth_id first
        console.log('Fetching cook auth_id...');
        const { data: cook, error: fetchError } = await supabase
          .from('cooks')
          .select('auth_id')
          .eq('cook_id', cookId)
          .single();

        console.log('Cook fetch result:', { cook, fetchError });

        if (fetchError) {
          console.error('Error fetching cook auth_id:', fetchError);
          throw fetchError;
        }

        if (!cook?.auth_id) {
          throw new Error('Cook auth_id not found');
        }

        // Get current session for authorization
        console.log('Getting session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session result:', { session: !!session });
        
        if (!session) {
          throw new Error('No active session');
        }

        // Call the delete-user edge function
        console.log('Calling delete-user edge function...');
        const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            recordId: cookId,
            recordType: 'cook',
            authId: cook.auth_id
          })
        });

        console.log('Edge function response status:', response.status);
        const result = await response.json();
        console.log('Edge function result:', result);

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete cook');
        }
              
        console.log('Cook deleted successfully');
        if (Platform.OS === 'web') {
          alert('Cook deleted successfully');
        } else {
          Alert.alert('Success', 'Cook deleted successfully');
        }
        loadCooks();
      } catch (error) {
        console.error('Error deleting cook - Full error details:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (Platform.OS === 'web') {
          alert(`Failed to delete cook: ${error.message || 'Unknown error'}`);
        } else {
          Alert.alert(
            'Error', 
            `Failed to delete cook: ${error.message || 'Unknown error'}`
          );
        }
      }
    };
    
    // Try web confirm first, then fallback to Alert.alert
    try {
      if (typeof window !== 'undefined' && window.confirm) {
        console.log('Using web confirm dialog for cook');
        const confirmed = window.confirm('Are you sure you want to delete this cook? This action cannot be undone.');
        console.log('User confirmed cook deletion:', confirmed);
        if (confirmed) {
          await performDelete();
        } else {
          console.log('Cook delete cancelled by user');
        }
      } else {
        throw new Error('window.confirm not available');
      }
    } catch (error) {
      console.log('Web confirm failed for cook, falling back to Alert.alert:', error);
      // Fallback to Alert.alert
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this cook? This action cannot be undone.',
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

  const renderCookCards = () => {
    return (
      <View style={styles.cooksContainer}>
        <View style={styles.cooksHeader}>
          <Text style={styles.cooksTitle}>👨‍🍳 Cooks ({cooks.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add Cook</Text>
          </TouchableOpacity>
        </View>
        
        {cooks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cooks available</Text>
            <Text style={styles.emptySubtext}>Create your first cook to get started</Text>
          </View>
        ) : (
          <View style={styles.cooksGrid}>
            {cooks.map((cook) => (
              <View key={cook.cook_id} style={styles.cookCard}>
                {/* Cook Details */}
                <View style={styles.cookDetails}>
                  <Text style={styles.cookName}>{cook.name}</Text>
                  <Text style={styles.cookEmail}>📧 {cook.email || 'No email'}</Text>
                  <Text style={styles.cookPhone}>📞 {cook.phone || 'No phone'}</Text>
                  {cook.address_line1 && (
                    <Text style={styles.cookAddress}>
                      📍 {cook.address_line1}
                      {cook.city && `, ${cook.city}`}
                      {cook.postal_code && ` ${cook.postal_code}`}
                    </Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.cookActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(cook)}
                  >
                    <Text style={styles.editButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      console.log('Delete button clicked for cook ID:', cook.cook_id);
                      deleteCook(cook.cook_id);
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
          <Text style={styles.loadingText}>Loading cooks...</Text>
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
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCooks} />}
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
                <Text style={styles.headerTitle}>👨‍🍳 Manage Cooks</Text>
                <Text style={styles.headerSubtitle}>Add, edit, and manage cook information</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Cooks Content */}
          {renderCookCards()}
        </ScrollView>
      </View>

      {/* Add/Edit Cook Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Cook' : 'Add New Cook'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Cook Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
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

            {/* Password fields for new cooks */}
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

            <Text style={styles.sectionLabel}>Address Information</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Address Line 1 (Optional)"
              value={formData.address_line1}
              onChangeText={(text) => setFormData({ ...formData, address_line1: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Address Line 2 (Optional)"
              value={formData.address_line2}
              onChangeText={(text) => setFormData({ ...formData, address_line2: text })}
            />
            
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="City (Optional)"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Postal Code (Optional)"
                value={formData.postal_code}
                onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
              />
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
                  {isEditing ? 'Update' : 'Create Cook'}
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
  cooksContainer: {
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
  cooksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cooksTitle: {
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
  cooksGrid: {
    padding: 16,
  },
  cookCard: {
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
  cookDetails: {
    marginBottom: 12,
  },
  cookName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cookEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cookPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cookAddress: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  cookActions: {
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
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
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

export default AdminCooksScreen;
