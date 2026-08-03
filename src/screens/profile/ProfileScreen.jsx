import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons/faUserCircle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENDPOINTS from '../../endpoint/endpoints';

const ProfileScreen = ({ navigation, route }) => {
  // Mock authentication state and user data for demonstration
  // In a real app, this should come from Redux, Context API, or AsyncStorage
  const defaultUser = route?.params?.user || {
    username: 'mgmg',
    email: 'mgmg@gmail.com',
  };
  
  // Set to true to show the logged-in state based on requirements
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserProfile();
    }
  }, [isLoggedIn]);

const fetchUserProfile = async () => {
  setIsLoading(true);

  try {
    // Read token from AsyncStorage first, fall back to route params
    const storedToken = await AsyncStorage.getItem('bearer_token');
    const token = storedToken || route?.params?.token || defaultUser?.token;

    console.log("Token:", token);

    const headers = {
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(ENDPOINTS.PROFILE, {
      method: 'GET',
      headers: headers,
    });

    const data = await response.json();

    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok) {
      setProfileData(data);
    } else {
      console.log(data);
    }
  } catch (e) {
    console.log(e);
  } finally {
    setIsLoading(false);
  }
};

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleCreateBusiness = () => {
    navigation.navigate('CreateBusiness');
  };

  const handleEditBusiness = () => {
    navigation.navigate('ProfileUpdate', { profileData });
  };

  // Extract user and owner data from profileData
  const userData = profileData?.owner?.user || profileData?.user || profileData || defaultUser;
  // Check if owner object exists rather than relying on is_owner boolean
  const isOwner = !!profileData?.owner;
  const businessName = profileData?.owner?.business_name || userData?.business_name;
  const phoneNumber = profileData?.owner?.phone_number || userData?.phone_number;
  
  let logoUrl = profileData?.owner?.logo || userData?.logo;
  if (logoUrl && !logoUrl.startsWith('http')) {
    // Prefix relative paths with the server base URL
    logoUrl = `https://apineeyrdirectory.fothubtv.com${logoUrl}`;
  }

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        // ----- View when User IS Logged In -----
        <View style={styles.contentContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#007BFF" style={{ marginBottom: 20 }} />
          ) : (
            <View style={styles.profileHeader}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} />
              ) : (
                <FontAwesomeIcon icon={faUserCircle} size={80} color="#ccc" />
              )}
              <Text style={styles.username}>{userData.username || userData.name || 'Unknown User'}</Text>
              <Text style={styles.email}>{userData.email || ''}</Text>
                <View style={styles.businessContainer}>
                  <Text style={styles.businessText}>Business: {businessName}</Text>
                  <Text style={styles.businessText}>Phone: {phoneNumber}</Text>
                  <TouchableOpacity style={styles.editButton} onPress={handleEditBusiness}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
            </View>
          )}
          
          {!isOwner && (
            <TouchableOpacity style={styles.createBusinessButton} onPress={handleCreateBusiness}>
              <Text style={styles.createBusinessButtonText}>Create Business Owner Account</Text>
            </TouchableOpacity>
          )}
          
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
    justifyContent: 'center', 
    alignItems: 'center',     
    padding: 20,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
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
    backgroundColor: '#007BFF', 
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
    borderColor: '#007BFF', 
    alignItems: 'center',
  },
  createBusinessButton: {
    backgroundColor: '#28a745', 
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: '#FF3B30', 
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
  },
  createBusinessButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  businessText: {
    fontSize: 16,
    color: '#007BFF',
    fontWeight: '500',
  },
  phoneText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  businessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  editButton: {
    marginLeft: 10,
    backgroundColor: '#f0ad4e',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  }
});