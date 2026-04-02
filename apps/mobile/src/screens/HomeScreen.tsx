import { formatCurrency } from '@spendwise/shared';
import { InsightCard } from '@spendwise/ui';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '../components/SectionCard';
import { mobileExpenses } from '../lib/mock-data';

const total = mobileExpenses.reduce((sum, expense) => sum + expense.amount, 0);

export const HomeScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>SpendWise Mobile</Text>
        <Text style={styles.title}>Track expenses, review patterns, and surface useful financial nudges on the go.</Text>
        <Text style={styles.subtitle}>
          The Expo starter mirrors the web dashboard and is ready to connect to the shared API contracts.
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

      <SectionCard eyebrow="AI starter" title="Insights">
        <InsightCard
          title="Transportation is stable"
          message="Commute spending is holding close to your recent average, which keeps your weekday burn rate predictable."
        />
        <InsightCard
          title="Food climbed this week"
          message="Market spending rose after a larger weekly restock. It may still fit budget if the rest of the week stays routine."
        />
      </SectionCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
    padding: 20,
    paddingTop: 32
  },
  hero: {
    gap: 12
  },
  eyebrow: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase'
  },
  title: {
    color: '#0F172A',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 24
  },
  helper: {
    color: '#475569',
    fontSize: 14
  },
  row: {
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16
  },
  rowTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600'
  },
  rowSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4
  },
  rowAmount: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700'
  }
});
