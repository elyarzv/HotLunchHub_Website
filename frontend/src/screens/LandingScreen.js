import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
} from 'react-native';

const LandingScreen = () => {
  const handleRoleLogin = (role) => {
    // In a real app, this would navigate to the role-specific login
    // For now, we'll just show an alert
    console.log(`Navigating to ${role} login`);
  };

  const openWebApp = (role) => {
    // This would open the web app at the specific role login
    const baseUrl = 'https://your-app.com'; // Replace with your actual web app URL
    const url = `${baseUrl}/#/${role.charAt(0).toUpperCase() + role.slice(1)}Login`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log(`Can't open URL: ${url}`);
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🚀 HotLunchHub</Text>
          <Text style={styles.subtitle}>Choose your login portal</Text>
        </View>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, { backgroundColor: '#007AFF' }]}
            onPress={() => handleRoleLogin('employee')}
          >
            <Text style={styles.roleIcon}>👷</Text>
            <Text style={styles.roleTitle}>Employee Portal</Text>
            <Text style={styles.roleDescription}>
              Order meals and track deliveries
            </Text>
            <Text style={styles.roleUrl}>/EmployeeLogin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, { backgroundColor: '#ff6b35' }]}
            onPress={() => handleRoleLogin('cook')}
          >
            <Text style={styles.roleIcon}>👨‍🍳</Text>
            <Text style={styles.roleTitle}>Cook Portal</Text>
            <Text style={styles.roleDescription}>
              Manage meal preparation and orders
            </Text>
            <Text style={styles.roleUrl}>/CookLogin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, { backgroundColor: '#28a745' }]}
            onPress={() => handleRoleLogin('driver')}
          >
            <Text style={styles.roleIcon}>🚚</Text>
            <Text style={styles.roleTitle}>Driver Portal</Text>
            <Text style={styles.roleDescription}>
              Handle deliveries and order status
            </Text>
            <Text style={styles.roleUrl}>/DriverLogin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, { backgroundColor: '#6f42c1' }]}
            onPress={() => handleRoleLogin('admin')}
          >
            <Text style={styles.roleIcon}>👑</Text>
            <Text style={styles.roleTitle}>Admin Portal</Text>
            <Text style={styles.roleDescription}>
              Full system access and management
            </Text>
            <Text style={styles.roleUrl}>/AdminLogin</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>🌐 Web App Access</Text>
          <Text style={styles.infoText}>
            You can also access these portals directly via web browser:
          </Text>
          <View style={styles.urlList}>
            <Text style={styles.urlItem}>• https://your-app.com/#/EmployeeLogin</Text>
            <Text style={styles.urlItem}>• https://your-app.com/#/CookLogin</Text>
            <Text style={styles.urlItem}>• https://your-app.com/#/DriverLogin</Text>
            <Text style={styles.urlItem}>• https://your-app.com/#/AdminLogin</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Secure role-based access system
          </Text>
          <Text style={styles.footerSubtext}>
            Each portal is restricted to authorized users only
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  roleContainer: {
    gap: 16,
    marginBottom: 30,
  },
  roleButton: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleUrl: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  urlList: {
    gap: 4,
  },
  urlItem: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LandingScreen;
