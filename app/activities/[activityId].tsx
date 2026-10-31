import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { useActivity } from '@/features/guide/use-guide';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Etkinlik detayı: amaç, malzeme, adım, süre, güvenlik, gözetim ve kaynak.
 * İçerik tamamen yereldir; çevrimdışı açılır.
 */
export default function ActivityDetailScreen() {
  const params = useLocalSearchParams<{ activityId?: string }>();
  const activityId = typeof params.activityId === 'string' ? params.activityId : '';
  const { activity, loading } = useActivity(activityId || null);

  if (loading || !activity) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title={tr.guide.title} onBack={() => router.back()} />
        <Text style={styles.loading}>{loading ? tr.common.loading : tr.common.errorGeneric}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title={activity.title}
        subtitle={activity.category_title ?? undefined}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.summary}>{activity.summary}</Text>
          <Text style={styles.meta}>
            {tr.development.ageRange(activity.min_age_months, activity.max_age_months)}
            {activity.estimated_minutes
              ? ` · ${tr.guide.minutesLabel(activity.estimated_minutes)}`
              : ''}
          </Text>
        </Card>

        {activity.purpose ? (
          <Card>
            <Text style={styles.sectionTitle}>{tr.guide.purposeLabel}</Text>
            <Text style={styles.bodyText}>{activity.purpose}</Text>
          </Card>
        ) : null}

        {activity.materials.length > 0 ? (
          <Card>
            <Text style={styles.sectionTitle}>{tr.guide.materialsLabel}</Text>
            {activity.materials.map((m, i) => (
              <Text key={i} style={styles.listItem}>
                • {m}
              </Text>
            ))}
          </Card>
        ) : null}

        {activity.steps.length > 0 ? (
          <Card>
            <Text style={styles.sectionTitle}>{tr.guide.stepsLabel}</Text>
            {activity.steps.map((s, i) => (
              <Text key={i} style={styles.listItem}>
                {i + 1}. {s}
              </Text>
            ))}
          </Card>
        ) : null}

        <View style={styles.safetyBox}>
          <Text style={styles.safetyTitle}>⚠️ {tr.guide.safetyLabel}</Text>
          <Text style={styles.safetyText}>{activity.safety_notes}</Text>
          {activity.adult_supervision === 'required' ? (
            <Text style={styles.safetyText}>👥 {tr.guide.supervisionRequired}</Text>
          ) : null}
        </View>

        <Card>
          <Text style={styles.sourceLabel}>{tr.development.sourceLabel}</Text>
          <Text style={styles.sourceText}>{activity.source_name ?? '—'}</Text>
          {activity.reviewed_at ? (
            <Text style={styles.sourceText}>
              {tr.development.reviewedAtLabel}: {activity.reviewed_at} · v{activity.content_version}
            </Text>
          ) : null}
          <Text style={styles.disclaimer}>{tr.guide.disclaimer}</Text>
        </Card>

        <Button
          label={tr.guide.planButton}
          onPress={() => router.push(`/activities/plan?activityId=${activity.id}`)}
          testID="activity-plan"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    padding: spacing.md,
  },
  summary: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  meta: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  bodyText: {
    ...typography.small,
    color: colors.text,
    lineHeight: 22,
  },
  listItem: {
    ...typography.small,
    color: colors.text,
    lineHeight: 24,
    marginTop: 4,
  },
  safetyBox: {
    backgroundColor: colors.surfaceMuted,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    borderRadius: 12,
    padding: spacing.md,
  },
  safetyTitle: {
    ...typography.small,
    color: colors.warning,
    fontWeight: '700',
  },
  safetyText: {
    ...typography.small,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  sourceLabel: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sourceText: {
    ...typography.small,
    color: colors.text,
    marginTop: 2,
  },
  disclaimer: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
