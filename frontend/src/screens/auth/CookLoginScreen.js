import React from 'react';
import LoginScreen from '../../components/auth/LoginScreen';

const CookLoginScreen = ({ navigation }) => {
  return <LoginScreen role="cook" navigation={navigation} />;
};

export default CookLoginScreen;
