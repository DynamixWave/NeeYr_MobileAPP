import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff', // အဖြူရောင် နောက်ခံ
          // လေးထောင့်ပုံစံဖြစ်စေရန် အောက်ခြေအစွန်းအထိ အပြည့်ကပ်ထားခြင်း (position: absolute ကို ဖြုတ်ထားပါသည်)
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0', // အပေါ်ဘက်မှာ ပါးလွှာတဲ့ အစင်းရာလေးတစ်ခု ခံထားခြင်း
          // ထောင့်စွန်းများ ဝိုင်းမနေစေရန် (borderRadius လုံးဝမပါပါ)
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          elevation: 8, // Android အတွက် အရိပ်အနည်းငယ်
          shadowColor: '#000', // iOS အတွက် အရိပ်
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#007AFF', // Active ဖြစ်နေစဉ် အရောင်
        tabBarInactiveTintColor: 'gray',   // Inactive အရောင်
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'Profile', 
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;