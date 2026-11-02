import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSessionStore } from '../../src/store/session-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, status, error } = useSessionStore();
  const isSubmitting = status === 'loading';

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLocalError(null);
    try {
      await login({ email: email.trim(), password });
    } catch {
      // Error state handled in store
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>SpendWise Mobile</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to your account to review expenses and budgets.
            </Text>
          </View>

          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                editable={!isSubmitting}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{"Don't have an account? "}</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Create one</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5EE',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 24,
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
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  button: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  linkText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '700',
  },
});
