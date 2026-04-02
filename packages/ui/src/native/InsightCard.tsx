import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../tokens';

interface InsightCardProps {
  title: string;
  message: string;
}

export const InsightCard = ({ title, message }: InsightCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700'
  },
  message: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 20
  }
});
