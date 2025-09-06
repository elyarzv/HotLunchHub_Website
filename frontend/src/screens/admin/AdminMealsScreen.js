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
  Image,
  Dimensions,
  FlatList,
  RefreshControl,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { CONFIG } from '../../constants/config';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with padding

const AdminMealsScreen = ({ navigation }) => {
  const [meals, setMeals] = useState([]);
  const [cooks, setCooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cook_id: '',
    is_weekly_special: false,
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadMeals();
    loadCooks();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          cooks!inner(name)
        `)
        .order('name');

      if (error) throw error;
      setMeals(data || []);
    } catch (error) {
      console.error('Error loading meals:', error);
      Alert.alert('Error', 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const loadCooks = async () => {
    try {
      const { data, error } = await supabase
        .from('cooks')
        .select('cook_id, name')
        .order('name');

      if (error) throw error;
      setCooks(data || []);
    } catch (error) {
      console.error('Error loading cooks:', error);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedMeal(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      cook_id: '',
      is_weekly_special: false,
    });
    setSelectedImages([]);
    setModalVisible(true);
  };

  const openEditModal = (meal) => {
    setIsEditing(true);
    setSelectedMeal(meal);
    setFormData({
      name: meal.name || '',
      description: meal.description || '',
      price: meal.price ? meal.price.toString() : '',
      cook_id: meal.cook_id || '',
      is_weekly_special: meal.is_weekly_special || false,
    });
    setSelectedImages(meal.picture_urls || []);
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Meal name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }
    if (!formData.cook_id) {
      Alert.alert('Error', 'Cook selection is required');
      return;
    }

    try {
      if (isEditing) {
        // Update existing meal
        const { error } = await supabase
          .from('meals')
          .update({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            cook_id: parseInt(formData.cook_id),
            is_weekly_special: formData.is_weekly_special,
            picture_urls: selectedImages,
            updated_at: new Date(),
          })
          .eq('meal_id', selectedMeal.meal_id);

        if (error) throw error;
        Alert.alert('Success', 'Meal updated successfully');
      } else {
        // Create new meal
        const { error } = await supabase
          .from('meals')
          .insert({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            cook_id: parseInt(formData.cook_id),
            is_weekly_special: formData.is_weekly_special,
            picture_urls: selectedImages,
          });

        if (error) throw error;
        Alert.alert('Success', 'Meal created successfully');
      }

      setModalVisible(false);
      loadMeals();
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', error.message || 'Failed to save meal');
    }
  };

  const deleteMeal = async (mealId) => {
    console.log('deleteMeal function called with ID:', mealId);
    console.log('Platform.OS:', Platform.OS);
    console.log('typeof window:', typeof window);
    console.log('window.confirm available:', typeof window.confirm);
    
    const performDelete = async () => {
      try {
        console.log('Attempting to delete meal with ID:', mealId);
        
        // Check if meal has any orders first
        console.log('Checking for orders...');
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('order_id')
          .eq('meal_id', mealId);
        
        console.log('Orders check result:', { orders, ordersError });
        
        if (ordersError) {
          console.error('Error checking orders:', ordersError);
          throw ordersError;
        }
        
        if (orders && orders.length > 0) {
          console.log(`Meal has ${orders.length} orders, cannot delete`);
          if (Platform.OS === 'web') {
            alert(`This meal has ${orders.length} order(s) and cannot be deleted. Please delete the orders first.`);
          } else {
            Alert.alert(
              'Cannot Delete', 
              `This meal has ${orders.length} order(s) and cannot be deleted. Please delete the orders first.`
            );
          }
          return;
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
            recordId: mealId,
            recordType: 'meal',
            authId: null // Meals don't have auth_id
          })
        });

        console.log('Edge function response status:', response.status);
        const result = await response.json();
        console.log('Edge function result:', result);

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete meal');
        }
        
        console.log('Meal deleted successfully');
        if (Platform.OS === 'web') {
          alert('Meal deleted successfully');
        } else {
          Alert.alert('Success', 'Meal deleted successfully');
        }
        loadMeals();
      } catch (error) {
        console.error('Error deleting meal - Full error details:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (Platform.OS === 'web') {
          alert(`Failed to delete meal: ${error.message || 'Unknown error'}`);
        } else {
          Alert.alert(
            'Error', 
            `Failed to delete meal: ${error.message || 'Unknown error'}`
          );
        }
      }
    };
    
    // Try web confirm first, then fallback to Alert.alert
    try {
      if (typeof window !== 'undefined' && window.confirm) {
        console.log('Using web confirm dialog for meal');
        const confirmed = window.confirm('Are you sure you want to delete this meal? This action cannot be undone.');
        console.log('User confirmed meal deletion:', confirmed);
        if (confirmed) {
          await performDelete();
        } else {
          console.log('Meal delete cancelled by user');
        }
      } else {
        throw new Error('window.confirm not available');
      }
    } catch (error) {
      console.log('Web confirm failed for meal, falling back to Alert.alert:', error);
      // Fallback to Alert.alert
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this meal? This action cannot be undone.',
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

  // Image handling functions
  const selectImages = () => {
    // For web, we'll use a file input approach
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          handleImageSelection(files);
        }
      };
      input.click();
    } else {
      // For mobile, you would typically use a library like react-native-image-picker
      Alert.alert('Image Selection', 'Image picker not implemented for mobile yet');
    }
  };

  const handleImageSelection = async (files) => {
    try {
      setUploadingImages(true);
      const uploadPromises = files.map(file => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      setSelectedImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Error', 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `meals/${fileName}`;

    const { data, error } = await supabase.storage
      .from('meal-pictures')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('meal-pictures')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const renderMealCards = () => {
    if (meals.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No meals available</Text>
          <Text style={styles.emptySubtext}>Create your first meal to get started</Text>
        </View>
      );
    }

    return (
      <View style={styles.mealsContainer}>
        <View style={styles.mealsHeader}>
          <Text style={styles.mealsTitle}>🍽️ Meals ({meals.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add Meal</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.mealsGrid}>
          {meals.map((meal) => (
            <View key={meal.meal_id} style={[styles.mealCard, { width: cardWidth }]}>
              {/* Meal Images */}
              {meal.picture_urls && meal.picture_urls.length > 0 ? (
                <View style={styles.mealImageContainer}>
                  <Image
                    source={{ uri: meal.picture_urls[0] }}
                    style={styles.mealImage}
                    resizeMode="cover"
                  />
                  {meal.picture_urls.length > 1 && (
                    <View style={styles.imageCountBadge}>
                      <Text style={styles.imageCountText}>+{meal.picture_urls.length - 1}</Text>
                    </View>
                  )}
                  {meal.is_weekly_special && (
                    <View style={styles.specialBadge}>
                      <Text style={styles.specialText}>⭐ Special</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noImageContainer}>
                  <Text style={styles.noImageText}>📷</Text>
                  <Text style={styles.noImageLabel}>No Image</Text>
                </View>
              )}

              {/* Meal Details */}
              <View style={styles.mealDetails}>
                <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
                <Text style={styles.mealPrice}>${meal.price}</Text>
                <Text style={styles.cookName}>👨‍🍳 {meal.cooks?.name || 'Unknown Cook'}</Text>
                {meal.description && (
                  <Text style={styles.mealDescription} numberOfLines={3}>
                    {meal.description}
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.mealActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(meal)}
                >
                  <Text style={styles.editButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteMeal(meal.meal_id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading meals...</Text>
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
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMeals} />}
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
                <Text style={styles.headerTitle}>🍽️ Manage Meals</Text>
                <Text style={styles.headerSubtitle}>Add, edit, and manage meal information</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Meals Content */}
          {renderMealCards()}
        </ScrollView>
      </View>

      {/* Add/Edit Meal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Meal' : 'Add New Meal'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Meal Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description (Optional)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Price * (e.g., 12.99)"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Cook *:</Text>
              <ScrollView style={styles.picker}>
                {cooks.map((cook) => (
                  <TouchableOpacity
                    key={cook.cook_id}
                    style={[
                      styles.pickerOption,
                      formData.cook_id === cook.cook_id && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, cook_id: cook.cook_id })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.cook_id === cook.cook_id && styles.pickerOptionTextSelected
                    ]}>
                      {cook.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[
                styles.checkboxContainer,
                formData.is_weekly_special && styles.checkboxSelected
              ]}
              onPress={() => setFormData({ 
                ...formData, 
                is_weekly_special: !formData.is_weekly_special 
              })}
            >
              <Text style={styles.checkboxText}>
                {formData.is_weekly_special ? '⭐' : '○'} Weekly Special
              </Text>
            </TouchableOpacity>

            {/* Image Management Section */}
            <View style={styles.imageSection}>
              <Text style={styles.imageSectionTitle}>📷 Meal Images</Text>
              
              {/* Selected Images Preview */}
              {selectedImages.length > 0 && (
                <View style={styles.imagePreviewContainer}>
                  <FlatList
                    data={selectedImages}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                      <View style={styles.imagePreviewItem}>
                        <Image source={{ uri: item }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Text style={styles.removeImageText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                </View>
              )}

              {/* Add Images Button */}
              <TouchableOpacity
                style={styles.addImagesButton}
                onPress={selectImages}
                disabled={uploadingImages}
              >
                <Text style={styles.addImagesButtonText}>
                  {uploadingImages ? '⏳ Uploading...' : '📷 Add Images'}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.imageHelpText}>
                Select multiple images to showcase your meal
              </Text>
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
                  {isEditing ? 'Update' : 'Create Meal'}
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
  // New card-based styles
  mealsContainer: {
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
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  mealsTitle: {
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
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  mealCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
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
  mealImageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: '#e9ecef',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    height: 120,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 32,
    marginBottom: 4,
  },
  noImageLabel: {
    fontSize: 12,
    color: '#666',
  },
  imageCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  specialBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mealDetails: {
    padding: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mealPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  cookName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  mealDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  mealActions: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 0,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  checkboxSelected: {
    backgroundColor: '#f8f9ff',
    borderColor: '#6f42c1',
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
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
  // Image management styles
  imageSection: {
    marginBottom: 20,
  },
  imageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imagePreviewContainer: {
    marginBottom: 12,
  },
  imagePreviewItem: {
    position: 'relative',
    marginRight: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addImagesButton: {
    backgroundColor: '#6f42c1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  addImagesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageHelpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AdminMealsScreen;
