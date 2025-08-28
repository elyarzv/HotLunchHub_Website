import React from 'react';
import LoginScreen from '../../components/auth/LoginScreen';

const DriverLoginScreen = ({ navigation }) => {
  return <LoginScreen role="driver" navigation={navigation} />;
};

export default DriverLoginScreen;
