import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ChipRow } from '@/components/chip-row';
import { EmptyState } from '@/components/empty-state';
import { Input } from '@/components/input';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { useGuide } from '@/features/guide/use-guide';
import { useChildAgeMonths } from '@/features/development/use-development';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Rehber sekmesi: kategori + yaş filtreli etkinlik listesi ve planlananlar.
 * Tüm içerik yereldir; internet gerekmez.
 */
export default function GuideScreen() {
  const { categories, activities, planned, loading, categorySlug, setCategorySlug, search, setSearch } =
    useGuide();
  const childMonths = useChildAgeMonths();

  const upcoming = planned.filter((p) => p.status === 'planned');
  const history = planned.filter((p) => p.status !== 'planned');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={tr.guide.title} subtitle={tr.guide.disclaimer} />

      <View style={styles.controls}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={tr.guide.searchPlaceholder}
          autoCapitalize="none"
          testID="guide-search"
        />
        <ChipRow
          items={[
            { key: '__all__', label: tr.guide.filterAllCategories },
            ...categories.map((c) => ({ key: c.slug, label: c.title })),
          ]}
          selectedKey={categorySlug ?? '__all__'}
          onSelect={(key) => setCategorySlug(key === '__all__' ? null : key)}
        />
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/activities/${item.id}`)}
              testID={`activity-${item.slug}`}
            >
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activitySummary} numberOfLines={2}>
                {item.summary}
              </Text>
              <Text style={styles.activityMeta}>
                {tr.development.ageRange(item.min_age_months, item.max_age_months)}
                {item.estimated_minutes ? ` · ${tr.guide.minutesLabel(item.estimated_minutes)}` : ''}
              </Text>
            </Pressable>
          </Card>
        )}
        ListHeaderComponent={
          upcoming.length > 0 ? (
            <View>
              <SectionHeader title={tr.guide.plannedSection} />
              {upcoming.slice(0, 3).map((p) => (
                <Card key={p.id}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(`/activities/complete?plannedId=${p.id}`)}
                    testID={`planned-${p.id}`}
                  >
                    <Text style={styles.plannedTitle}>
                      {p.activity_title ?? p.custom_title ?? ''}
                    </Text>
                    <Text style={styles.plannedMeta}>
                      {p.planned_for ? `${tr.guide.plannedForLabel}: ${p.planned_for}` : ''}
                    </Text>
                  </Pressable>
                </Card>
              ))}
              <SectionHeader title={tr.guide.title} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={tr.guide.activitiesEmpty}
              description={
                childMonths !== null
                  ? tr.guide.disclaimer
                  : tr.guide.placeholder
              }
            />
          ) : (
            <Text style={styles.loading}>{tr.common.loading}</Text>
          )
        }
      />

      {history.length === 0 && upcoming.length === 0 ? null : (
        <View style={styles.fabRow}>
          <Button
            label={tr.guide.plannedSection}
            variant="secondary"
            onPress={() => router.push('/activities/planned')}
            testID="guide-open-planned"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    paddingHorizontal: spacing.md,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 96,
    gap: spacing.sm,
  },
  activityTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  activitySummary: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  activityMeta: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: 4,
    fontWeight: '600',
  },
  plannedTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  plannedMeta: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  fabRow: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
});
