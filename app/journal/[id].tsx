import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { useReadyDb } from '@/database/db-provider';
import { JournalRepository, type JournalEntryWithTags } from '@/database/repositories/journal-repository';
import { DevelopmentAreasRepository } from '@/database/repositories/development-areas-repository';
import { useJournalMedia } from '@/features/media/use-media';
import { mediaAbsoluteUri } from '@/services/media/media-service';
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
  const media = useJournalMedia(id || null);

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
          void (async () => {
            const { MediaRepository } = await import('@/database/repositories/media-repository');
            const { MediaService } = await import('@/services/media/media-service');
            const mediaRepo = new MediaRepository(db);
            const mediaSvc = new MediaService(db);
            const linked = await mediaRepo.forJournal(id);
            await mediaSvc.cleanupJournalMedia(id);
            await repository.remove(id);
            await mediaSvc.removeAssetsIfUnlinked(linked.map((m) => m.id));
            router.back();
          })();
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

        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>{tr.journal.mediaSection}</Text>
          <View style={styles.mediaRow}>
            {media.assets.map((m) => (
              <View key={m.id} style={styles.mediaThumb}>
                {m.media_type === 'image' ? (
                  <Image
                    source={{ uri: mediaAbsoluteUri(m.thumbnail_relative_path ?? m.relative_path) }}
                    style={styles.mediaImage}
                    accessibilityLabel={m.original_name ?? 'Fotoğraf'}
                  />
                ) : m.thumbnail_relative_path ? (
                  <Image
                    source={{ uri: mediaAbsoluteUri(m.thumbnail_relative_path) }}
                    style={styles.mediaImage}
                    accessibilityLabel={m.original_name ?? 'Video'}
                  />
                ) : (
                  <View style={[styles.mediaImage, styles.videoPlaceholder]}>
                    <Ionicons name="videocam" size={24} color={colors.textMuted} />
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tr.journal.mediaRemove}
                  onPress={() => void media.remove(m.id)}
                  style={styles.mediaRemove}
                  testID={`media-remove-${m.id}`}
                >
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </Pressable>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => void media.addFromLibrary()}
              disabled={media.busy}
              style={[styles.mediaThumb, styles.mediaAdd]}
              testID="media-add"
            >
              <Ionicons name={media.busy ? 'hourglass-outline' : 'add-circle-outline'} size={28} color={colors.primaryDark} />
              <Text style={styles.mediaAddText}>{media.busy ? tr.media.importing : tr.journal.mediaAdd}</Text>
            </Pressable>
          </View>
          {media.error ? <Text style={styles.mediaError}>{media.error}</Text> : null}
        </View>

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
  mediaSection: {
    marginTop: spacing.md,
  },
  mediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  mediaThumb: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaAdd: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  mediaAddText: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  mediaRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  mediaError: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.lg,
  },
  gap: {
    height: spacing.sm,
  },
});
