import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { useReadyDb } from '@/database/db-provider';
import { JournalRepository, type JournalEntryWithTags } from '@/database/repositories/journal-repository';
import { DevelopmentAreasRepository } from '@/database/repositories/development-areas-repository';
import { JOURNAL_ENTRY_TYPE_LABELS, type JournalEntryType } from '@/domain/journal-types';
import { tr } from '@/i18n/tr';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * Kayıt detay ekranı: tür, tarih, metin, etiketler, favori ve silme.
 */
export default function JournalDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const db = useReadyDb();
  const repository = useMemo(() => new JournalRepository(db), [db]);
  const areasRepo = useMemo(() => new DevelopmentAreasRepository(db), [db]);

  const [entry, setEntry] = useState<JournalEntryWithTags | null>(null);
  const [loading, setLoading] = useState(true);
  const [areaTitle, setAreaTitle] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    repository
      .get(id)
      .then(async (row) => {
        if (!active) return;
        setEntry(row);
        setLoading(false);
        if (row?.area_id) {
          const area = await areasRepo.bySlug(row.area_id).catch(() => null);
          void area;
          const all = await areasRepo.listActive().catch(() => []);
          if (active) {
            setAreaTitle(all.find((a) => a.id === row.area_id)?.title ?? null);
          }
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, repository, areasRepo]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title={tr.journal.title} onBack={() => router.back()} />
        <Text style={styles.loading}>{tr.common.loading}</Text>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title={tr.journal.title} onBack={() => router.back()} />
        <Text style={styles.loading}>{tr.common.errorGeneric}</Text>
      </SafeAreaView>
    );
  }

  const typeLabel = JOURNAL_ENTRY_TYPE_LABELS[entry.entry_type as JournalEntryType] ?? entry.entry_type;

  const confirmDelete = () => {
    Alert.alert(tr.journal.deleteConfirmTitle, tr.journal.deleteConfirmBody, [
      { text: tr.common.cancel, style: 'cancel' },
      {
        text: tr.common.delete,
        style: 'destructive',
        onPress: () => {
          void repository.remove(id).then(() => router.back());
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title={typeLabel}
        onBack={() => router.back()}
        trailing={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={entry.is_favorite === 1 ? tr.journal.unfavorite : tr.journal.favorite}
            onPress={() => {
              void repository.toggleFavorite(id).then((fav) => {
                setEntry((prev) => (prev ? { ...prev, is_favorite: fav ? 1 : 0 } : prev));
              });
            }}
            style={styles.favButton}
            testID="journal-detail-favorite"
          >
            <Ionicons
              name={entry.is_favorite === 1 ? 'heart' : 'heart-outline'}
              size={24}
              color={colors.clay}
            />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.date}>{entry.occurred_at}</Text>
          {entry.title ? <Text style={styles.title}>{entry.title}</Text> : null}
          <Text style={styles.body}>{entry.body}</Text>

          {areaTitle ? (
            <Text style={styles.meta}>
              {tr.journal.areaLabel}: {areaTitle}
            </Text>
          ) : null}

          {entry.tags.length > 0 ? (
            <View style={styles.tagChips}>
              {entry.tags.map((t) => (
                <View key={t} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{t}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.created}>{entry.created_at}</Text>
        </Card>

        <Text style={styles.mediaNote}>{tr.journal.mediaNote}</Text>

        <View style={styles.actions}>
          <Button
            label={tr.journal.edit}
            variant="secondary"
            onPress={() => router.push({ pathname: '/journal/editor', params: { id } })}
            testID="journal-detail-edit"
          />
          <View style={styles.gap} />
          <Button label={tr.common.delete} variant="danger" onPress={confirmDelete} testID="journal-detail-delete" />
        </View>
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
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    padding: spacing.md,
  },
  favButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    ...typography.small,
    color: colors.textMuted,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.text,
    lineHeight: 26,
    marginTop: spacing.sm,
  },
  meta: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  tagChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tagChip: {
    backgroundColor: colors.sageLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tagChipText: {
    ...typography.small,
    color: colors.primaryDark,
  },
  created: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  mediaNote: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  actions: {
    marginTop: spacing.lg,
  },
  gap: {
    height: spacing.sm,
  },
});
