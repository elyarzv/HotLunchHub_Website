// Admin Meals Screen
// Comprehensive meal management for administrators
// Allows adding, editing, and managing available meals

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

const AdminMealsScreen = ({ navigation }) => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newMeal, setNewMeal] = useState({
    name: '',
    description: '',
    price: '',
    is_weekly_special: false,
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeals(data || []);
    } catch (error) {
      console.error('Error loading meals:', error);
      Alert.alert('Error', 'Failed to load meals: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async () => {
    if (!newMeal.name || !newMeal.price) {
      Alert.alert('Validation Error', 'Please fill in meal name and price');
      return;
    }

    if (isNaN(parseFloat(newMeal.price)) || parseFloat(newMeal.price) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('meals')
        .insert([{
          name: newMeal.name,
          description: newMeal.description || '',
          price: parseFloat(newMeal.price),
          is_weekly_special: newMeal.is_weekly_special,
        }])
        .select()
        .single();

      if (error) throw error;

      setMeals([data, ...meals]);
      setShowAddMealModal(false);
      resetNewMealForm();
      
      Alert.alert('Success', 'Meal added successfully!');
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Error', 'Failed to add meal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeal = async () => {
    if (!editingMeal.name || !editingMeal.price) {
      Alert.alert('Validation Error', 'Please fill in meal name and price');
      return;
    }

    if (isNaN(parseFloat(editingMeal.price)) || parseFloat(editingMeal.price) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('meals')
        .update({
          name: editingMeal.name,
          description: editingMeal.description || '',
          price: parseFloat(editingMeal.price),
          is_weekly_special: editingMeal.is_weekly_special,
        })
        .eq('meal_id', editingMeal.meal_id)
        .select()
        .single();

      if (error) throw error;

      setMeals(meals.map(meal => 
        meal.meal_id === editingMeal.meal_id ? data : meal
      ));
      setEditingMeal(null);
      
      Alert.alert('Success', 'Meal updated successfully!');
    } catch (error) {
      console.error('Error updating meal:', error);
      Alert.alert('Error', 'Failed to update meal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = (mealId) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('meals')
                .delete()
                .eq('meal_id', mealId);

              if (error) throw error;
              
              setMeals(meals.filter(meal => meal.meal_id !== mealId));
              Alert.alert('Success', 'Meal deleted successfully');
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const resetNewMealForm = () => {
    setNewMeal({
      name: '',
      description: '',
      price: '',
      is_weekly_special: false,
    });
  };

  const startEditMeal = (meal) => {
    setEditingMeal({
      meal_id: meal.meal_id,
      name: meal.name,
      description: meal.description || '',
      price: meal.price.toString(),
      is_weekly_special: meal.is_weekly_special,
    });
  };

  const filteredMeals = meals.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (meal.description && meal.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && meals.length === 0) {
    return <LoadingSpinner text="Loading meals..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>🍽️ Meal Management</Text>
            <Text style={styles.subtitle}>Manage available meals and specials</Text>
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
            placeholder="Search meals by name or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Add Meal Button */}
        <View style={styles.addMealSection}>
          <CustomButton
            title="➕ Add New Meal"
            onPress={() => setShowAddMealModal(true)}
            style={styles.addMealButton}
            size="large"
          />
        </View>

        {/* Meals List */}
        <View style={styles.mealsList}>
          {filteredMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🍽️</Text>
              <Text style={styles.emptyStateText}>No meals found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery 
                  ? 'Try adjusting your search'
                  : 'Start by adding your first meal'
                }
              </Text>
            </View>
          ) : (
            filteredMeals.map(meal => (
              <View key={meal.meal_id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealPrice}>${meal.price}</Text>
                    {meal.is_weekly_special && (
                      <View style={styles.specialBadge}>
                        <Text style={styles.specialText}>Weekly Special</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.mealActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => startEditMeal(meal)}
                    >
                      <Text style={styles.actionButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteMeal(meal.meal_id)}
                    >
                      <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {meal.description && (
                  <Text style={styles.mealDescription}>{meal.description}</Text>
                )}
                
                <Text style={styles.mealDate}>
                  Created: {new Date(meal.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMealModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Meal</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddMealModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Meal Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter meal name"
                  value={newMeal.name}
                  onChangeText={(text) => setNewMeal({...newMeal, name: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter meal description (optional)"
                  value={newMeal.description}
                  onChangeText={(text) => setNewMeal({...newMeal, description: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Price *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={newMeal.price}
                  onChangeText={(text) => setNewMeal({...newMeal, price: text})}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setNewMeal({...newMeal, is_weekly_special: !newMeal.is_weekly_special})}
                >
                  <Text style={styles.checkboxIcon}>
                    {newMeal.is_weekly_special ? '☑️' : '⬜'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Mark as Weekly Special</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                onPress={() => setShowAddMealModal(false)}
                style={styles.cancelButton}
                size="large"
              />
              <CustomButton
                title="Add Meal"
                onPress={handleAddMeal}
                loading={loading}
                disabled={loading}
                style={styles.addButton}
                size="large"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Meal Modal */}
      <Modal
        visible={!!editingMeal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Meal</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEditingMeal(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Meal Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter meal name"
                  value={editingMeal?.name}
                  onChangeText={(text) => setEditingMeal({...editingMeal, name: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter meal description (optional)"
                  value={editingMeal?.description}
                  onChangeText={(text) => setEditingMeal({...editingMeal, description: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Price *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={editingMeal?.price}
                  onChangeText={(text) => setEditingMeal({...editingMeal, price: text})}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setEditingMeal({...editingMeal, is_weekly_special: !editingMeal.is_weekly_special})}
                >
                  <Text style={styles.checkboxIcon}>
                    {editingMeal?.is_weekly_special ? '☑️' : '⬜'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Mark as Weekly Special</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                onPress={() => setEditingMeal(null)}
                style={styles.cancelButton}
                size="large"
              />
              <CustomButton
                title="Update Meal"
                onPress={handleEditMeal}
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
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
  addMealSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  addMealButton: {
    backgroundColor: '#28a745',
  },
  mealsList: {
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
  mealCard: {
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
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mealPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  specialBadge: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  specialText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  mealActions: {
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
  mealDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  mealDate: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxIcon: {
    fontSize: 20,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
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

export default AdminMealsScreen;
