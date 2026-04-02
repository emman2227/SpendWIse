import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import { QueryProvider } from './src/providers/query-provider';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  return (
    <QueryProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <HomeScreen />
      </SafeAreaView>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5EE'
  }
});
