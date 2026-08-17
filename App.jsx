import React from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { FavoriteProvider } from './src/context/FavoriteContext';

const App = () => {
  return (
    <SafeAreaProvider>
      {/* 👇 edges ထဲမှာ 'bottom' ပါ ထည့်ပေးလိုက်ပါ */}
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <FavoriteProvider>
          <AppNavigator />
        </FavoriteProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});