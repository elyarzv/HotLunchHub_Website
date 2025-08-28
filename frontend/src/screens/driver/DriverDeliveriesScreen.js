// Driver Deliveries Screen
// Placeholder screen for driver deliveries

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DriverDeliveriesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Deliveries</Text>
      <Text style={styles.subtitle}>This screen will show pending deliveries and delivery management</Text>
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

export default DriverDeliveriesScreen;
