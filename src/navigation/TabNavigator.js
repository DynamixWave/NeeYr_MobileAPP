import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CategoryScreen from '../screens/category/CategoryScreen';
import NewsScreen from '../screens/news/NewsScreen';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHouse } from '@fortawesome/free-solid-svg-icons/faHouse';
import { faNewspaper } from '@fortawesome/free-solid-svg-icons/faNewspaper';
import { faList } from '@fortawesome/free-solid-svg-icons/faList';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff', 
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
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
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faHouse} size={size} color={color} />
          ),
        }}
      />
       <Tab.Screen
        name="Category"
        component={CategoryScreen}
        options={{
          title: 'Category',
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faList} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="News"
        component={NewsScreen}
        options={{
          title: 'News',
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faNewspaper} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'Profile', 
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faUser} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;