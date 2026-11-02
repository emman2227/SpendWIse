import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '../../src/lib/api/client';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+15551234567');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Get started</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Sign up to start tracking your finances with AI insights.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Registration successful!</Text>
              <Text style={styles.successText}>
                Please check your email for verification before signing in.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.buttonText}>Go to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Jane Doe"
                  placeholderTextColor="#94A3B8"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
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
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+15551234567"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
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
                onPress={handleRegister}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.linkText}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          )}
        </ScrollView>
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
    padding: 24,
    gap: 20,
  },
  header: {
    gap: 8,
    marginTop: 20,
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
  successBox: {
    backgroundColor: '#E0F2FE',
    borderColor: '#38BDF8',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  successTitle: {
    color: '#0369A1',
    fontSize: 18,
    fontWeight: '700',
  },
  successText: {
    color: '#0C4A6E',
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 14,
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
