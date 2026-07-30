import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';

const ProfileScreen = ({ navigation }) => {
  // Replace this with your actual authentication state (e.g., from Redux or Context API)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        // ----- View when User IS Logged In -----
        <View style={styles.contentContainer}>
          <Text style={styles.title}>ProfileScreen</Text>
          <Text style={styles.subtitle}>Welcome back!</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={() => setIsLoggedIn(false)}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ----- View when User is NOT Logged In -----
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Not Logged In</Text>
          <Text style={styles.subtitle}>Please log in or create an account to view your profile.</Text>

          {/* Log In Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center', // အပေါ်အောက် အလယ်ကျစေရန်
    alignItems: 'center',     // ဘယ်ညာ အလယ်ကျစေရန်
    padding: 20,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#007BFF', // Blue color for primary action
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  signupButton: {
    backgroundColor: '#ffffff',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007BFF', // Blue border for secondary action
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30', // Red color for destructive action
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButtonText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: '600',
  }
});