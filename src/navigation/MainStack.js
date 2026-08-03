import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/profile/Login';
import SignUpScreen from '../screens/profile/Signup';
import CreateBusinessScreen from '../screens/profile/CreateBusiness';
import ProfileUpdateScreen from '../screens/profile/ProfileUpdate';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Stack ထဲမှာ TabNavigator ကို ထည့်လိုက်ခြင်းအားဖြင့် အောက်ခြေ Tab ပါလာပါမယ် */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
      <Stack.Screen name="ProfileUpdate" component={ProfileUpdateScreen} />
    </Stack.Navigator>
  );
};

export default MainStack;