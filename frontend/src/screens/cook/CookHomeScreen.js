// Cook Home Screen
// Main screen for cooks to view orders and manage meal preparation

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/common/CustomButton';

const CookHomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'Cook'}!</Text>
        <Text style={styles.subtitle}>Ready to prepare some delicious meals?</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Welcome to the Kitchen</Text>
        <Text style={styles.description}>
          This is where you'll manage meal orders and update preparation status.
        </Text>
        
        <CustomButton
          title="View Orders"
          onPress={() => navigation.navigate('CookOrders')}
          style={styles.button}
        />
        
        <CustomButton
          title="View Profile"
          onPress={() => navigation.navigate('CookProfile')}
          variant="outline"
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ff6b35',
    padding: 24,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    marginBottom: 16,
  },
});

export default CookHomeScreen;
