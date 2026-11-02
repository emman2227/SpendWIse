import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryProvider } from '../src/providers/query-provider';
import { useSessionStore } from '../src/store/session-store';

function RootLayoutNav() {
  const { status, initialize } = useSessionStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (status === 'idle' || status === 'loading') {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [status, segments, router]);

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </QueryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F5EE',
  },
});
