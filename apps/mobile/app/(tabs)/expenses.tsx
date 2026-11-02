import { formatCurrency } from '@spendwise/shared';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '../../src/components/SectionCard';
import { mobileExpenses } from '../../src/lib/mock-data';

export default function ExpensesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Ledger</Text>
          <Text style={styles.title}>Expenses</Text>
          <Text style={styles.subtitle}>
            View and manage your recent transactions across all categories.
          </Text>
        </View>

        <SectionCard eyebrow="All Activity" title="Transactions">
          {mobileExpenses.map((expense) => (
            <View key={expense.id} style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>{expense.description}</Text>
                <Text style={styles.rowCategory}>{expense.categoryId}</Text>
              </View>
              <Text style={styles.rowAmount}>{formatCurrency(expense.amount)}</Text>
            </View>
          ))}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  rowTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  rowCategory: {
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
