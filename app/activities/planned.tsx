import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { usePlannedActivities } from '@/features/guide/use-guide';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

const STATUS_LABELS: Record<string, string> = {
  planned: tr.guide.statusPlanned,
  completed: tr.guide.statusCompleted,
  postponed: tr.guide.statusPostponed,
  skipped: tr.guide.statusSkipped,
};

/**
 * Tüm planlanan/geçmiş etkinlikler listesi (plan tarihi ve durumuna göre).
 */
export default function PlannedActivitiesScreen() {
  const { items, loading } = usePlannedActivities();

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={tr.guide.plannedSection} onBack={() => router.back()} />
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.title}>{item.activity_title ?? item.custom_title ?? '—'}</Text>
            <Text style={styles.meta}>
              {item.planned_for ? `${item.planned_for} · ` : ''}
              {STATUS_LABELS[item.status] ?? item.status}
            </Text>
            {item.parent_note ? <Text style={styles.note}>{item.parent_note}</Text> : null}
            {item.status === 'planned' ? (
              <View style={styles.actions}>
                <Button
                  label={tr.guide.completeButton}
                  onPress={() => router.push(`/activities/complete?plannedId=${item.id}`)}
                  testID={`planned-complete-${item.id}`}
                />
              </View>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={tr.guide.plannedSection}
              description={tr.guide.plannedEmpty}
            />
          ) : (
            <Text style={styles.loading}>{tr.common.loading}</Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  meta: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  note: {
    ...typography.small,
    color: colors.text,
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.sm,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
