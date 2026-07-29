import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './RootNavigation';
import MainStack from './MainStack'; // (သို့) သင့်ရဲ့ Stack တွေ

const AppNavigator = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <MainStack />
    </NavigationContainer>
  );
};

export default AppNavigator;