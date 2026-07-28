import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello Welcome</Text>
    </View>
  )
}

export default App

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // ဒေါင်လိုက် (Vertical) အလယ်တည့်တည့်
    alignItems: 'center',     // ဘေးတိုက် (Horizontal) အလယ်တည့်တည့်
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
})