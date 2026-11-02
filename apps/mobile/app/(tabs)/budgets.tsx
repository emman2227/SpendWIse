import { formatCurrency } from '@spendwise/shared';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '../../src/components/SectionCard';

const mockBudgets = [
  { id: '1', category: 'Groceries', spent: 340, limit: 500, period: 'Monthly' },
  { id: '2', category: 'Dining Out', spent: 185, limit: 200, period: 'Monthly' },
  { id: '3', category: 'Entertainment', spent: 75, limit: 150, period: 'Monthly' },
];

export default function BudgetsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Spending Limits</Text>
          <Text style={styles.title}>Budgets</Text>
          <Text style={styles.subtitle}>
            Monitor your monthly limits and stay within safe thresholds.
          </Text>
        </View>

        <SectionCard eyebrow="Category Allocations" title="Active Budgets">
          {mockBudgets.map((budget) => {
            const percentage = Math.min(100, Math.round((budget.spent / budget.limit) * 100));
            return (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.categoryName}>{budget.category}</Text>
                  <Text style={styles.budgetSpent}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${percentage}%`,
                        backgroundColor: percentage > 90 ? '#EF4444' : '#0F766E',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.percentageText}>{percentage}% spent</Text>
              </View>
            );
          })}
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
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  budgetSpent: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
});
