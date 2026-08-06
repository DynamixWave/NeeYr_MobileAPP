import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator , Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import ENDPOINTS from '../../endpoint/endpoints';
import { setProfileCache, invalidateProfileCache } from '../../utils/lookupCache';

const CreateBusinessScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!phoneNumber || !businessName) {
      Alert.alert('Error', 'Please fill in all fields');
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

      const response = await fetch(ENDPOINTS.PROFILE_CREATE, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (data?.owner) {
          await setProfileCache(data);
        } else {
          await invalidateProfileCache();
        }
        Alert.alert('Success', 'Business Profile created successfully!');
        navigation.goBack();
      } else {
        const errorMsg = data.error || data.detail || 'Failed to create business profile';
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
      console.log(file);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Business Account</Text>
      <Text style={styles.subtitle}>Fill in details to set up your business profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number (e.g. 09960408001)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholderTextColor="#949494"
      />

      <TextInput
        style={styles.input}
        placeholder="Business Name (e.g. DynamixWave)"
        value={businessName}
        onChangeText={setBusinessName}
        placeholderTextColor="#949494"
      />

      <View style={styles.container}>
        <Button
          title="Choose Image"
          onPress={pickImage}
        />
      </View>


      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Profile</Text>
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

export default CreateBusinessScreen;
