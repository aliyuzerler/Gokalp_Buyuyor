import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Card } from '@/components/card';
import { ChipRow } from '@/components/chip-row';
import { EmptyState } from '@/components/empty-state';
import { Input } from '@/components/input';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenContainer } from '@/components/screen-container';
import {
  useDevelopmentAreas2,
  useSkills,
  useChildAgeMonths,
} from '@/features/development/use-development';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

type AgeFilter = 'child' | 'all' | '0_6' | '6_12' | '12_24' | '24_36' | '36p';

const AGE_FILTERS: { key: AgeFilter; label: string }[] = [
  { key: 'child', label: tr.development.ageFilterChild },
  { key: '0_6', label: tr.development.ageFilter0_6 },
  { key: '6_12', label: tr.development.ageFilter6_12 },
  { key: '12_24', label: tr.development.ageFilter12_24 },
  { key: '24_36', label: tr.development.ageFilter24_36 },
  { key: '36p', label: tr.development.ageFilter36 },
  { key: 'all', label: tr.development.ageFilterAll },
];

function ageMonthsFromFilter(filter: AgeFilter, childMonths: number | null): number | null {
  switch (filter) {
    case 'child':
      return childMonths;
    case 'all':
      return null;
    case '0_6':
      return 3;
    case '6_12':
      return 9;
    case '12_24':
      return 18;
    case '24_36':
      return 30;
    case '36p':
      return 48;
  }
}

/**
 * Alan detayı: beceri listesi + arama + yaş aralığı filtresi (0–216).
 */
export default function AreaDetailScreen() {
  const params = useLocalSearchParams<{ areaSlug?: string }>();
  const areaSlug = typeof params.areaSlug === 'string' ? params.areaSlug : '';
  const { areas } = useDevelopmentAreas2();
  const area = areas.find((a) => a.slug === areaSlug) ?? null;
  const childMonths = useChildAgeMonths();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AgeFilter>('child');
  const { skills, loading } = useSkills(
    area?.id ?? null,
    search,
    ageMonthsFromFilter(filter, childMonths),
  );

  if (!area) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title={tr.development.title} onBack={() => router.back()} />
        <Text style={styles.loading}>{tr.common.loading}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title={area.title}
        subtitle={area.description ?? undefined}
        onBack={() => router.back()}
      />
      <ScreenContainer>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={tr.development.searchPlaceholder}
          autoCapitalize="none"
          testID="skills-search"
        />
        <ChipRow<AgeFilter>
          items={AGE_FILTERS}
          selectedKey={filter}
          onSelect={setFilter}
        />
        <FlatList
          contentContainerStyle={styles.list}
          data={skills}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/skills/${item.id}`)}
                testID={`skill-${item.slug}`}
              >
                <Text style={styles.skillTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.skillDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={styles.skillAge}>
                  {tr.development.ageRange(item.min_age_months, item.max_age_months)}
                </Text>
              </Pressable>
            </Card>
          )}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title={tr.development.skillsEmpty}
                description={tr.development.disclaimer}
              />
            ) : (
              <Text style={styles.loading}>{tr.common.loading}</Text>
            )
          }
        />
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  skillTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  skillDesc: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  skillAge: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: 4,
    fontWeight: '600',
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    padding: spacing.md,
  },
});
