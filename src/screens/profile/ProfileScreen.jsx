import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ProfileScreen</Text>
    </View>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center', // အပေါ်အောက် အလယ်ကျစေရန်
    alignItems: 'center',     // ဘယ်ညာ အလယ်ကျစေရန်
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  }
})