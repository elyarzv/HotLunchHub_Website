// Employee Orders Screen
// Placeholder screen for employee orders

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmployeeOrdersScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Employee Orders</Text>
      <Text style={styles.subtitle}>This screen will show all employee orders and their status</Text>
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

export default EmployeeOrdersScreen;
