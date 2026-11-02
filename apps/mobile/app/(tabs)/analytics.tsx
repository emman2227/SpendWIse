import { InsightCard } from '@spendwise/ui';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '../../src/components/SectionCard';

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>AI Intelligence</Text>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>
            Financial patterns, anomalies, and forward-looking forecasts.
          </Text>
        </View>

        <SectionCard eyebrow="Weekly Highlights" title="Spending Nudges">
          <InsightCard
            title="Transportation is stable"
            message="Commute spending is holding close to your recent average, keeping your weekday burn rate predictable."
          />
          <InsightCard
            title="Food climbed this week"
            message="Market spending rose after a larger weekly restock. It may still fit budget if the rest of the week stays routine."
          />
          <InsightCard
            title="Subscription Check"
            message="Two recurring charges are expected in the next 4 days. Safe balance is projected to remain positive."
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
});
