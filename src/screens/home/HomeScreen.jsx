import { View, Text, StyleSheet, TextInput, SafeAreaView , Image } from 'react-native';
import React from 'react';

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/image/Logo.png')} style={styles.logo} />
        <Text style={styles.title}>Welcome to NeeYr</Text>
      </View>

      {/* Search Section */}
      <Text className="pf_logo">Profile Logo</Text>
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search shops by name..." 
          placeholderTextColor="#888"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light, modern app background color
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginTop: 0,
    marginBottom: 25,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',

  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  logo: {
    width: 60,
    height:60,
    alignSelf: 'center',
  },
  pf_logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    position: 'relative',
    top: -30,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 52,
    width: '80%',
    position: 'relative',
    right: -70,
    
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    
    // Shadow for Android
    elevation: 3, 
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
});