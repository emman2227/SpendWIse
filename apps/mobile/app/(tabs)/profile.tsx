import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SectionCard } from '../../src/components/SectionCard';
import { useSessionStore } from '../../src/store/session-store';

export default function ProfileScreen() {
  const { user, logout } = useSessionStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      Alert.alert('Error', 'Failed to log out cleanly.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your identity, settings, and active session.</Text>
        </View>

        <SectionCard eyebrow="Personal Details" title={user?.name ?? 'Account Info'}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email ?? 'Not signed in'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Currency</Text>
            <Text style={styles.infoValue}>{user?.currency ?? 'USD'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>
              {user?.emailVerified ? 'Verified Account' : 'Verification Pending'}
            </Text>
          </View>
        </SectionCard>

        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5EE',
  },
  container: {
    padding: 20,
    gap: 20,
    paddingTop: 16,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  infoValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
});
