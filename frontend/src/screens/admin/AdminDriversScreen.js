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

const AdminDriversScreen = ({ navigation }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
      Alert.alert('Error', 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedDriver(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (driver) => {
    setIsEditing(true);
    setSelectedDriver(driver);
    setFormData({
      name: driver.name || '',
      email: driver.email || '',
      phone: driver.phone || '',
      password: '',
      confirmPassword: '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Driver name is required');
      return;
    }

    // Password validation for new drivers
    if (!isEditing) {
      if (!formData.email.trim()) {
        Alert.alert('Error', 'Email is required for new drivers');
        return;
      }
      if (!formData.password.trim()) {
        Alert.alert('Error', 'Password is required for new drivers');
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
        // Update existing driver
        const { error } = await supabase
          .from('drivers')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            updated_at: new Date(),
          })
          .eq('driver_id', selectedDriver.driver_id);

        if (error) throw error;
        Alert.alert('Success', 'Driver updated successfully');
      } else {
        // Create new driver with user account
        await createDriverUser();
      }

      setModalVisible(false);
      loadDrivers();
    } catch (error) {
      console.error('Error saving driver:', error);
      Alert.alert('Error', error.message || 'Failed to save driver');
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

  const deleteDriver = async (driverId) => {
    console.log('deleteDriver function called with ID:', driverId);
    console.log('Platform.OS:', Platform.OS);
    console.log('typeof window:', typeof window);
    console.log('window.confirm available:', typeof window.confirm);
    
    const performDelete = async () => {
      try {
        console.log('Attempting to delete driver with ID:', driverId);
        
        // Get the driver's auth_id first
        const { data: driver, error: fetchError } = await supabase
          .from('drivers')
          .select('auth_id')
          .eq('driver_id', driverId)
          .single();

        if (fetchError) {
          console.error('Error fetching driver auth_id:', fetchError);
          throw fetchError;
        }

        if (!driver?.auth_id) {
          throw new Error('Driver auth_id not found');
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
            recordId: driverId,
            recordType: 'driver',
            authId: driver.auth_id
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete driver');
        }
        
        console.log('Driver deleted successfully');
        if (Platform.OS === 'web') {
          alert('Driver deleted successfully');
        } else {
          Alert.alert('Success', 'Driver deleted successfully');
        }
        loadDrivers();
      } catch (error) {
        console.error('Error deleting driver:', error);
        if (Platform.OS === 'web') {
          alert(`Failed to delete driver: ${error.message || 'Unknown error'}`);
        } else {
          Alert.alert(
            'Error', 
            `Failed to delete driver: ${error.message || 'Unknown error'}`
          );
        }
      }
    };
    
    // Try web confirm first, then fallback to Alert.alert
    try {
      if (typeof window !== 'undefined' && window.confirm) {
        console.log('Using web confirm dialog');
        const confirmed = window.confirm('Are you sure you want to delete this driver? This action cannot be undone.');
        console.log('User confirmed:', confirmed);
        if (confirmed) {
          await performDelete();
        } else {
          console.log('Delete cancelled by user');
        }
      } else {
        throw new Error('window.confirm not available');
      }
    } catch (error) {
      console.log('Web confirm failed, falling back to Alert.alert:', error);
      // Fallback to Alert.alert
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this driver? This action cannot be undone.',
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

  const renderDriverCards = () => {
    return (
      <View style={styles.driversContainer}>
        <View style={styles.driversHeader}>
          <Text style={styles.driversTitle}>🚗 Drivers ({drivers.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add Driver</Text>
          </TouchableOpacity>
        </View>
        
        {drivers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No drivers available</Text>
            <Text style={styles.emptySubtext}>Create your first driver to get started</Text>
          </View>
        ) : (
          <View style={styles.driversGrid}>
            {drivers.map((driver) => (
              <View key={driver.driver_id} style={styles.driverCard}>
                {/* Driver Details */}
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <Text style={styles.driverEmail}>📧 {driver.email || 'No email'}</Text>
                  <Text style={styles.driverPhone}>📞 {driver.phone || 'No phone'}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.driverActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(driver)}
                  >
                    <Text style={styles.editButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      console.log('Delete button clicked for driver ID:', driver.driver_id);
                      // Test web confirm first
                      if (typeof window !== 'undefined' && window.confirm) {
                        console.log('Testing web confirm...');
                        const testConfirm = window.confirm('Test: Can you see this dialog?');
                        console.log('Test confirm result:', testConfirm);
                      }
                      deleteDriver(driver.driver_id);
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
          <Text style={styles.loadingText}>Loading drivers...</Text>
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
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDrivers} />}
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
                <Text style={styles.headerTitle}>🚗 Manage Drivers</Text>
                <Text style={styles.headerSubtitle}>Add, edit, and manage driver information</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Drivers Content */}
          {renderDriverCards()}
        </ScrollView>
      </View>

      {/* Add/Edit Driver Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Driver' : 'Add New Driver'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Driver Name *"
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

            {/* Password fields for new drivers */}
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
                  {isEditing ? 'Update' : 'Create Driver'}
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
  driversContainer: {
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
  driversHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  driversTitle: {
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
  driversGrid: {
    padding: 16,
  },
  driverCard: {
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
  driverDetails: {
    marginBottom: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  driverEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: '#666',
  },
  driverActions: {
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

export default AdminDriversScreen;
