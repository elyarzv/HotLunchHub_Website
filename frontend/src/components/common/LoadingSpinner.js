// Loading Spinner Component
// A reusable loading indicator for the app

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { CONFIG } from '../../constants/config';

const LoadingSpinner = ({ 
  size = 'large', 
  color = '#007AFF', 
  text = 'Loading...',
  containerStyle = {},
  textStyle = {}
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text style={[styles.text, textStyle]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoadingSpinner;
