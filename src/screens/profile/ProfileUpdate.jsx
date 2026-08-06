import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Button, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import ENDPOINTS from '../../endpoint/endpoints';
import { setProfileCache, invalidateProfileCache } from '../../utils/lookupCache';

const ProfileUpdateScreen = ({ navigation, route }) => {
  // Pre-fill with existing data passed through navigation params
  const { profileData } = route.params || {};

  const initialPhone = profileData?.owner?.phone_number || profileData?.phone_number || profileData?.user?.phone_number || '';
  const initialBusiness = profileData?.owner?.business_name || profileData?.business_name || profileData?.user?.business_name || '';

  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [businessName, setBusinessName] = useState(initialBusiness);
  const [logo, setLogo] = useState(null); // Will store the selected image
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    if (!phoneNumber || !businessName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem('bearer_token');
      const headers = {
        'Accept': 'application/json',
      };
      if (storedToken) {
        headers['Authorization'] = storedToken.includes(' ') 
          ? storedToken 
          : (storedToken.startsWith('eyJ') ? `Bearer ${storedToken}` : `Token ${storedToken}`);
      }

      const formData = new FormData();
      formData.append('phone_number', phoneNumber);
      formData.append('business_name', businessName);
      
      if (logo) {
        formData.append('logo', {
          uri: logo.uri,
          type: logo.type || 'image/jpeg',
          name: logo.fileName || 'logo.jpg',
        });
      }

      const response = await fetch(ENDPOINTS.PROFILE_UPDATE, {
        method: 'PUT',
        headers: headers,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        await setProfileCache(data?.owner ? data : null);
        if (!data?.owner) {
          await invalidateProfileCache();
        }
        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      } else {
        const errorMsg = data.error || data.detail || 'Failed to update profile';
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      Alert.alert('Error', 'Network request failed. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
    });

    if (!result.didCancel && result.assets?.length) {
      const file = result.assets[0];
      setLogo(file);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Profile</Text>
      <Text style={styles.subtitle}>Update your business details below</Text>

      <TextInput
        style={styles.input}
        placeholder="Business Name (e.g. DynamixWave)"
        value={businessName}
        onChangeText={setBusinessName}
        placeholderTextColor="#949494"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number (e.g. 09960408001)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholderTextColor="#949494"
      />

      <View style={styles.imagePickerContainer}>
        <Button
          title="Choose New Logo"
          onPress={pickImage}
        />
        {logo && (
          <Image source={{ uri: logo.uri }} style={styles.previewImage} />
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Profile</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
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
  imagePickerContainer: {
    marginVertical: 15,
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    marginTop: 15,
    borderRadius: 50,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default ProfileUpdateScreen;
