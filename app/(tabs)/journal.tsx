import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ChipRow } from '@/components/chip-row';
import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { useJournal } from '@/features/journal/use-journal';
import {
  JOURNAL_ENTRY_TYPES,
  JOURNAL_ENTRY_TYPE_LABELS,
  type JournalEntryType,
} from '@/domain/journal-types';
import { tr } from '@/i18n/tr';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type Filter = JournalEntryType | 'all' | 'favorites';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: tr.journal.filterAll },
  ...JOURNAL_ENTRY_TYPES.map((t) => ({ key: t as Filter, label: JOURNAL_ENTRY_TYPE_LABELS[t] })),
  { key: 'favorites', label: tr.journal.filterFavorites },
];

export default function JournalScreen() {
  const [entryType, setEntryType] = useState<JournalEntryType | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { entries, loading, hasMore, load } = useJournal({ entryType, favoritesOnly });
  const selected: Filter = favoritesOnly ? 'favorites' : (entryType ?? 'all');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={tr.journal.title} />

      <View style={styles.filters}>
        <ChipRow<Filter>
          items={FILTERS}
          selectedKey={selected}
          onSelect={(key) => {
            setFavoritesOnly(key === 'favorites');
            setEntryType(key === 'all' || key === 'favorites' ? null : (key as JournalEntryType));
          }}
        />
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/journal/${item.id}`)}
              style={styles.entry}
              testID={`journal-entry-${item.id}`}
            >
              <View style={styles.entryHeader}>
                <Text style={styles.typeBadge}>
                  {JOURNAL_ENTRY_TYPE_LABELS[item.entry_type as JournalEntryType] ?? item.entry_type}
                </Text>
                <Text style={styles.date}>{item.occurred_at}</Text>
                {item.is_favorite === 1 ? (
                  <Ionicons name="heart" size={16} color={colors.clay} />
                ) : null}
              </View>
              {item.title ? <Text style={styles.entryTitle}>{item.title}</Text> : null}
              <Text style={styles.entryPreview} numberOfLines={2}>
                {item.body}
              </Text>
            </Pressable>
          </Card>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={tr.journal.emptyTitle}
              description={tr.journal.emptyDesc}
              action={
                <Button
                  label={tr.journal.newTitle}
                  onPress={() => router.push('/journal/editor?type=memory')}
                  testID="journal-empty-new"
                />
              }
            />
          ) : (
            <Text style={styles.loading}>{tr.common.loading}</Text>
          )
        }
        onEndReached={() => {
          if (hasMore && !loading) void load(entries.length);
        }}
        onEndReachedThreshold={0.4}
      />

      <View style={styles.fabRow}>
        <Button
          label={`＋ ${tr.journal.newTitle}`}
          onPress={() => router.push('/journal/editor?type=memory')}
          testID="journal-new"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filters: {
    paddingHorizontal: spacing.md,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 96,
    gap: spacing.sm,
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
  entry: {
    gap: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    ...typography.small,
    color: colors.primaryDark,
    backgroundColor: colors.sageLight,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
    fontWeight: '600',
  },
  date: {
    ...typography.small,
    color: colors.textMuted,
    flex: 1,
  },
  entryTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  entryPreview: {
    ...typography.small,
    color: colors.textMuted,
  },
});
