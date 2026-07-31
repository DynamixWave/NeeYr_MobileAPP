import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

const HomeScreen = () => {
  return (
    <>
    <View className="profile-container" style={styles.container}>
      <Text style={styles.title}>Welcome to NeeYr Mobile App</Text>
    </View>

    <View>
      
    </View>
    </>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center', 
    alignItems: 'center',     
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  }
})