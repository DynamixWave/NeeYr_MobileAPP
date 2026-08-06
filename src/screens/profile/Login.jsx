import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENDPOINTS from '../../endpoint/endpoints';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const COMMON_HEADERS = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      };

      // Try sending JSON first, if login backend expects JSON
      let response = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          ...COMMON_HEADERS,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email.trim(),
          password: password,
        }),
      });

      let rawText = await response.text();
      let data = {};
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        console.error("Login response is not JSON:", rawText);
      }

      // Check if Imunify360 bot-protection blocked the request
      if (data?.message && data.message.includes('Imunify360')) {
        console.warn("Imunify360 detected. Retrying with FormData and alternative User-Agent...");
        const formData = new FormData();
        formData.append('username', email.trim());
        formData.append('password', password);

        response = await fetch(ENDPOINTS.LOGIN, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'NeeYrMobileApp/1.0 (Android; React Native)',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          body: formData,
        });

        rawText = await response.text();
        try {
          data = JSON.parse(rawText);
        } catch (e) {}
      } else if (!response.ok) {
        // If JSON format didn't succeed, fallback to FormData
        console.log("JSON login failed with status:", response.status, ". Retrying with FormData...");
        const formData = new FormData();
        formData.append('username', email.trim());
        formData.append('password', password);

        const formDataResponse = await fetch(ENDPOINTS.LOGIN, {
          method: 'POST',
          headers: COMMON_HEADERS,
          body: formData,
        });

        const formDataRaw = await formDataResponse.text();
        let formDataData = {};
        try {
          formDataData = JSON.parse(formDataRaw);
        } catch (e) {}

        if (formDataResponse.ok || (!formDataData?.message?.includes('Imunify360') && (response.status === 400 || response.status === 401))) {
          response = formDataResponse;
          data = formDataData;
        }
      }

      console.log("LOGIN RESPONSE STATUS:", response.status);
      console.log("LOGIN RESPONSE DATA:", JSON.stringify(data, null, 2));

      // Extract token across all known conventions
      const token = 
        data.tokens?.access || 
        data.tokens?.token || 
        data.token || 
        data.key || 
        data.access || 
        data.access_token || 
        data.auth_token || 
        data.bearer_token || 
        data.jwt || 
        data.data?.token || 
        data.data?.access || 
        data.data?.access_token || 
        data.data?.key || 
        data.user?.token || 
        data.user?.access || 
        data.user?.key || 
        data.authorisation?.token || 
        data.authorization?.token;

      console.log("EXTRACTED TOKEN:", token);

      const isBotBlocked = data?.message && data.message.includes('Imunify360');

      if (response.ok && !isBotBlocked && token) {
        Alert.alert('Success', 'Logged in successfully!');
        
        const userObj = data.user || {
          username: email,
          email: email,
        };

        await AsyncStorage.setItem('bearer_token', token);
        
        // Navigate back to the Profile tab inside MainTabs
        navigation.navigate('MainTabs', {
          screen: 'Profile',
          params: { user: userObj, token: token }
        });
      } else {
        let errorMsg = data.error || data.detail || data.message || 'Invalid credentials';
        if (isBotBlocked) {
          errorMsg = 'Security Protection (Imunify360) blocked the login request from this IP/device.\n\nPlease contact your server administrator or try switching network/VPN.';
        }
        Alert.alert('Login Failed', errorMsg);
      }
    } catch (error) {
      Alert.alert('Error', 'Network request failed. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Log in to manage your business</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Username"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#949494"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#949494"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.link}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#007BFF', // Primary Blue
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#666',
    fontSize: 15,
  },
  link: {
    color: '#007BFF',
    fontSize: 15,
    fontWeight: 'bold',
  }
});

export default LoginScreen;