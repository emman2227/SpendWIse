import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}

export const SectionCard = ({ eyebrow, title, children }: SectionCardProps) => {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 28,
    borderWidth: 1,
    padding: 20
  },
  eyebrow: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '700'
  },
  content: {
    gap: 14,
    marginTop: 16
  }
});
