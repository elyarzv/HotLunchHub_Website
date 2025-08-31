// CookHomeScreen.js
// Main screen for cooks to view orders, manage meals, and upload meal images

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Modal,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabase';
import { AuthContext } from '../../context/AuthContext';

const CookHomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [mealForm, setMealForm] = useState({
    name: '',
    description: '',
    price: '',
    picture_urls: [], // Changed to array for multiple images
    is_weekly_special: false,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false); // For multiple images
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    totalMeals: 0,
  });

  // Load cook data on mount or when user changes
  useEffect(() => {
    if (user?.role === 'cook') {
      loadCookData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadCookData = async () => {
    try {
      setLoading(true);

      // Fetch meals for this cook
      const cookId = user.roleDetails?.cook_id;
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .eq('cook_id', cookId)
        .order('name');

      if (mealsError) throw mealsError;
      setMeals(mealsData || []);

      // Fetch orders for these meals
      const mealIds = mealsData?.map(m => m.meal_id) || [];
      if (mealIds.length === 0) {
        setOrders([]);
        setStats({
          totalOrders: 0,
          pendingOrders: 0,
          preparingOrders: 0,
          readyOrders: 0,
          totalMeals: mealsData?.length || 0,
        });
        setLoading(false);
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          meals!inner(name, price),
          employees!inner(name),
          companies!inner(name)
        `)
        .in('meal_id', mealIds)
        .order('order_date', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Calculate stats
      setStats({
        totalOrders: ordersData?.length || 0,
        pendingOrders: ordersData?.filter(o => o.status === 'pending').length || 0,
        preparingOrders: ordersData?.filter(o => o.status === 'preparing').length || 0,
        readyOrders: ordersData?.filter(o => o.status === 'ready').length || 0,
        totalMeals: mealsData?.length || 0,
      });
    } catch (error) {
      console.error('Error loading cook data:', error);
      Alert.alert('Error', 'Failed to load cook data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCookData();
  };

  // Pick image from library
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow multiple selection
        allowsMultipleSelection: true, // Enable multiple selection
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingImages(true);
        
        // Upload all selected images
        const uploadedUrls = [];
        for (const asset of result.assets) {
          try {
            const imageUri = asset.uri;
            const uploadedUrl = await uploadImage(imageUri);
            if (uploadedUrl) {
              uploadedUrls.push(uploadedUrl);
            }
          } catch (error) {
            console.error('Failed to upload image:', error);
          }
        }
        
        // Update form with all uploaded URLs
        setMealForm(prev => ({
          ...prev,
          picture_urls: [...prev.picture_urls, ...uploadedUrls]
        }));
        
        setUploadingImages(false);
        
        if (uploadedUrls.length > 0) {
          Alert.alert('Success', `${uploadedUrls.length} image(s) uploaded successfully!`);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
      setUploadingImages(false);
    }
  };

  const uploadImage = async (imageUri) => {
    try {
      setUploadingImage(true);
  
      // Convert to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
  
      // ✅ Detect extension safely
      let ext = 'jpg';
      if (blob.type) {
        // e.g. "image/jpeg" → "jpeg"
        ext = blob.type.split('/')[1];
      }
  
      // ✅ Always generate clean filename
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `meals/${fileName}`;
  
      console.log('📤 Uploading file:', filePath);
  
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('meal-pictures')
        .upload(filePath, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: true,
        });
  
      if (error) throw error;
  
      const { data: publicData } = supabase.storage
        .from('meal-pictures')
        .getPublicUrl(filePath);
  
      return publicData.publicUrl;
    } catch (error) {
      console.error('❌ Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload image.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image from meal form
  const removeImage = (indexToRemove) => {
    setMealForm(prev => ({
      ...prev,
      picture_urls: prev.picture_urls.filter((_, index) => index !== indexToRemove)
    }));
  };

  // Clear all images
  const clearAllImages = () => {
    setMealForm(prev => ({
      ...prev,
      picture_urls: []
    }));
  };

  // Open create meal modal
  const openCreateMealModal = () => {
    setMealForm({
      name: '',
      description: '',
      price: '',
      picture_urls: [], // Reset to empty array
      is_weekly_special: false,
    });
    setUploadingImage(false);
    setUploadingImages(false); // Reset multiple image upload state
    setModalVisible(true);
  };

  // Create meal in Supabase
  const createMeal = async () => {
    // Validate all required fields
    if (!mealForm.name.trim()) {
      Alert.alert('Error', 'Meal name is required.');
      return;
    }
    
    if (!mealForm.description.trim()) {
      Alert.alert('Error', 'Meal description is required.');
      return;
    }
    
    if (!mealForm.price || parseFloat(mealForm.price) <= 0) {
      Alert.alert('Error', 'Valid price is required.');
      return;
    }
    
    if (mealForm.picture_urls.length === 0) {
      Alert.alert('Error', 'At least one image is required.');
      return;
    }

    try {
      const cookId = user.roleDetails?.cook_id;
      const { data, error } = await supabase
        .from('meals')
        .insert({
          cook_id: cookId,
          name: mealForm.name.trim(),
          description: mealForm.description.trim(),
          price: parseFloat(mealForm.price),
          picture_urls: mealForm.picture_urls,
          is_weekly_special: mealForm.is_weekly_special,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Meal created successfully!');
      setModalVisible(false);
      onRefresh();
    } catch (error) {
      console.error('Error creating meal:', error);
      Alert.alert('Error', error.message || 'Failed to create meal.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render the component
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Cook Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, {user?.email}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.preparingOrders}</Text>
            <Text style={styles.statLabel}>Preparing</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.readyOrders}</Text>
            <Text style={styles.statLabel}>Ready</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={openCreateMealModal}>
            <Text style={styles.actionButtonText}>Create New Meal</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {orders.length > 0 ? (
            orders.slice(0, 5).map((order) => (
              <View key={order.order_id} style={styles.orderCard}>
                <Text style={styles.orderText}>Order #{order.order_id}</Text>
                <Text style={styles.orderText}>Status: {order.status}</Text>
                <Text style={styles.orderText}>Date: {new Date(order.created_at).toLocaleDateString()}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No orders yet</Text>
          )}
        </View>

        {/* Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Meals</Text>
          {meals.length > 0 ? (
            meals.map((meal) => (
              <View key={meal.meal_id} style={styles.mealCard}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealPrice}>${meal.price}</Text>
                <Text style={styles.mealDescription}>{meal.description}</Text>
                
                {/* Display meal images */}
                {meal.picture_urls && meal.picture_urls.length > 0 && (
                  <View style={styles.mealImagesContainer}>
                    <Text style={styles.mealImagesTitle}>Images:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealImagesScroll}>
                      {meal.picture_urls.map((imageUrl, index) => (
                        <Image key={index} source={{ uri: imageUrl }} style={styles.mealImage} />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No meals created yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Create Meal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Meal</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Meal Name *"
              value={mealForm.name}
              onChangeText={(text) => setMealForm(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description *"
              value={mealForm.description}
              onChangeText={(text) => setMealForm(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Price *"
              value={mealForm.price}
              onChangeText={(text) => setMealForm(prev => ({ ...prev, price: text }))}
              keyboardType="numeric"
            />
            
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.imageButtonText}>
                {uploadingImages ? 'Uploading...' : 'Pick Images'}
              </Text>
            </TouchableOpacity>
            
            {/* Display selected images */}
            {mealForm.picture_urls.length > 0 && (
              <View style={styles.imagesContainer}>
                <View style={styles.imagesHeader}>
                  <Text style={styles.imagesTitle}>Selected Images ({mealForm.picture_urls.length})</Text>
                  <TouchableOpacity style={styles.clearButton} onPress={clearAllImages}>
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                  {mealForm.picture_urls.map((imageUrl, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
                      <TouchableOpacity 
                        style={styles.removeImageButton} 
                        onPress={() => removeImage(index)}
                      >
                        <Text style={styles.removeImageButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={createMeal}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CookHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  orderCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  orderText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  mealCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  mealPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  mealDescription: {
    fontSize: 14,
    color: '#666',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
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
    marginBottom: 15,
    fontSize: 16,
  },
  imageButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imagesContainer: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
  imagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    padding: 5,
    backgroundColor: '#FF3B30',
    borderRadius: 5,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagesScroll: {
    // Add any specific styles for the ScrollView if needed
  },
  imageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 5,
  },
  removeImageButton: {
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mealImagesContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
  mealImagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  mealImagesScroll: {
    // Add any specific styles for the ScrollView if needed
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
  },
});
