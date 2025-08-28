import React from 'react';
import LoginScreen from '../../components/auth/LoginScreen';

const AdminLoginScreen = ({ navigation }) => {
  return <LoginScreen role="admin" navigation={navigation} />;
};

export default AdminLoginScreen;
