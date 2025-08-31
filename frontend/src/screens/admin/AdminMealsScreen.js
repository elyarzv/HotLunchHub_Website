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
} from 'react-native';
import { supabase } from '../../services/supabase';

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
    Alert.alert(
      'Confirm Delete',
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
              Alert.alert('Success', 'Meal deleted successfully');
              loadMeals();
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal');
            }
          },
        },
      ]
    );
  };

  const renderMealTable = () => {
    if (meals.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No meals available</Text>
          <Text style={styles.emptySubtext}>Create your first meal to get started</Text>
        </View>
      );
    }

    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>🍽️ Meals</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add Meal</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Name</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Cook</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Price</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Special</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
        </View>

        {meals.map((meal) => (
          <View key={meal.meal_id} style={styles.tableRow}>
            <View style={[styles.tableCell, { flex: 2 }]}>
              <Text style={styles.mealName}>{meal.name}</Text>
              {meal.description && (
                <Text style={styles.mealDescription} numberOfLines={2}>
                  {meal.description}
                </Text>
              )}
            </View>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <Text style={styles.cookName}>{meal.cooks?.name || 'Unknown'}</Text>
            </View>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <Text style={styles.price}>${meal.price}</Text>
            </View>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <Text style={[styles.specialBadge, meal.is_weekly_special && styles.specialActive]}>
                {meal.is_weekly_special ? '⭐' : '—'}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(meal)}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteMeal(meal.meal_id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Meals</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderMealTable()}
      </ScrollView>

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
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerSpacer: {
    width: 60,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  mealDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cookName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
    textAlign: 'center',
  },
  specialBadge: {
    fontSize: 16,
    textAlign: 'center',
  },
  specialActive: {
    color: '#ffc107',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#dc3545',
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
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
});

export default AdminMealsScreen;
