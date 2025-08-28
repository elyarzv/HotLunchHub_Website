import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const RoleSelectionScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🚀 HotLunchHub</Text>
          <Text style={styles.subtitle}>Select your role to continue</Text>
        </View>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => navigation.navigate('AdminLogin')}
          >
            <Text style={styles.roleIcon}>👑</Text>
            <Text style={styles.roleTitle}>Administrator</Text>
            <Text style={styles.roleDescription}>
              System management and user administration
            </Text>
          </TouchableOpacity>

          <View style={styles.comingSoonContainer}>
            <TouchableOpacity style={styles.roleButtonDisabled} disabled>
              <Text style={styles.roleIcon}>👷</Text>
              <Text style={styles.roleTitle}>Employee</Text>
              <Text style={styles.roleDescription}>
                Order meals and track deliveries
              </Text>
              <Text style={styles.comingSoon}>Coming Soon</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.comingSoonContainer}>
            <TouchableOpacity style={styles.roleButtonDisabled} disabled>
              <Text style={styles.roleIcon}>👨‍🍳</Text>
              <Text style={styles.roleTitle}>Cook</Text>
              <Text style={styles.roleDescription}>
                Manage meal preparation and orders
              </Text>
              <Text style={styles.comingSoon}>Coming Soon</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.comingSoonContainer}>
            <TouchableOpacity style={styles.roleButtonDisabled} disabled>
              <Text style={styles.roleIcon}>🚚</Text>
              <Text style={styles.roleTitle}>Driver</Text>
              <Text style={styles.roleDescription}>
                Handle deliveries and order status
              </Text>
              <Text style={styles.comingSoon}>Coming Soon</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Secure access for authorized users only
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
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
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#a8a8a8',
    textAlign: 'center',
  },
  roleContainer: {
    gap: 16,
  },
  roleButton: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e94560',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  roleButtonDisabled: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    opacity: 0.6,
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 16,
    color: '#a8a8a8',
    textAlign: 'center',
    lineHeight: 22,
  },
  comingSoonContainer: {
    position: 'relative',
  },
  comingSoon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#e94560',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default RoleSelectionScreen;
