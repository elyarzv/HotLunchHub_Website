// Employee Order Meals Screen
// Placeholder screen for employee meal ordering

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmployeeOrderMealsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Meals</Text>
      <Text style={styles.subtitle}>This screen will show available meals and allow employees to place orders</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default EmployeeOrderMealsScreen;
