import { formatCurrency } from '@spendwise/shared';
import { InsightCard } from '@spendwise/ui';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '../../src/components/SectionCard';
import { mobileExpenses } from '../../src/lib/mock-data';
import { useSessionStore } from '../../src/store/session-store';

const total = mobileExpenses.reduce((sum, expense) => sum + expense.amount, 0);

export default function DashboardScreen() {
  const { user } = useSessionStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{user ? `Hello, ${user.name}` : 'SpendWise Mobile'}</Text>
          <Text style={styles.title}>Track expenses, review patterns, and take control.</Text>
          <Text style={styles.subtitle}>
            Your mobile dashboard is connected and synchronizing with your SpendWise account.
          </Text>
        </View>

        <SectionCard eyebrow="Monthly snapshot" title={formatCurrency(total)}>
          <Text style={styles.helper}>2 seeded transactions this week</Text>
          <Text style={styles.helper}>Forecast confidence: 72%</Text>
        </SectionCard>

        <SectionCard eyebrow="Recent spending" title="Transactions">
          {mobileExpenses.map((expense) => (
            <View key={expense.id} style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>{expense.description}</Text>
                <Text style={styles.rowSubtitle}>{expense.categoryId}</Text>
              </View>
              <Text style={styles.rowAmount}>{formatCurrency(expense.amount)}</Text>
            </View>
          ))}
        </SectionCard>

        <SectionCard eyebrow="AI Intelligence" title="Insights">
          <InsightCard
            title="Transportation is stable"
            message="Commute spending is holding close to your recent average, keeping your weekday burn rate predictable."
          />
          <InsightCard
            title="Food climbed this week"
            message="Market spending rose after a larger weekly restock. It may still fit budget if the rest of the week stays routine."
          />
        </SectionCard>
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
    gap: 20,
    padding: 20,
    paddingTop: 16,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  helper: {
    color: '#475569',
    fontSize: 14,
  },
  row: {
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  rowTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
  rowAmount: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
});
