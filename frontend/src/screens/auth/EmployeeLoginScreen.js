import React from 'react';
import LoginScreen from '../../components/auth/LoginScreen';

const EmployeeLoginScreen = ({ navigation }) => {
  return <LoginScreen role="employee" navigation={navigation} />;
};

export default EmployeeLoginScreen;
