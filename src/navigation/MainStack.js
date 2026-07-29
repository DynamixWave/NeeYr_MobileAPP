import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Stack ထဲမှာ TabNavigator ကို ထည့်လိုက်ခြင်းအားဖြင့် အောက်ခြေ Tab ပါလာပါမယ် */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
    </Stack.Navigator>
  );
};

export default MainStack;