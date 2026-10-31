import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { useTimeline } from '@/features/timeline/use-timeline';
import { useArchiveStats } from '@/features/timeline/use-archive-stats';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Arşiv: zaman çizelgesi + profil/ayarlar erişimi.
 */
export default function ArchiveScreen() {
  const { items, loading, hasMore, load } = useTimeline();
  const stats = useArchiveStats();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={tr.tabs.archive} />

      <SectionHeader title={tr.archive.settingsSection} />
      <Card>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings/profile')}
          style={styles.row}
          testID="archive-open-profile"
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{tr.archive.settingsOpenProfile}</Text>
            <Text style={styles.rowDesc}>{tr.archive.settingsOpenProfileDesc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/interests')}
          style={styles.row}
          testID="archive-open-interests"
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>İlgi alanları</Text>
            <Text style={styles.rowDesc}>Gökalp’in merak ettikleri</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings/reminders')}
          style={styles.row}
          testID="archive-open-reminders"
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Hatırlatmalar</Text>
            <Text style={styles.rowDesc}>Yerel bildirimler</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/media')}
          style={styles.row}
          testID="archive-open-media"
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{tr.archive.openMedia}</Text>
            <Text style={styles.rowDesc}>{tr.archive.openMediaDesc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings/backup')}
          style={styles.row}
          testID="archive-open-backup"
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{tr.backup.title}</Text>
            <Text style={styles.rowDesc}>{tr.backup.createDesc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </Card>

      <SectionHeader title="Arşiv özeti" subtitle="Yalnızca betimleyici bilgi — gelişim skoru yok" />
      <Card testID="archive-stats">
        <Text style={styles.rowDesc}>
          {stats.journalCount} günlük kaydı · {stats.mediaCount} medya · {stats.interestCount} ilgi alanı
        </Text>
        <Text style={styles.rowDesc}>
          {stats.firstRecord ? `İlk kayıt: ${stats.firstRecord}` : 'Henüz kayıt yok'}
          {stats.lastRecord ? ` · Son kayıt: ${stats.lastRecord}` : ''}
        </Text>
      </Card>

      <SectionHeader title={tr.archive.timelineSection} />

      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        renderItem={({ item }) => (
          <View style={styles.timelineItem}>
            <View style={styles.timelineMarker}>
              <Ionicons
                name={item.kind === 'journal' ? 'book-outline' : item.kind === 'skill_observation' ? 'leaf-outline' : 'compass-outline'}
                size={16}
                color={colors.primaryDark}
              />
            </View>
            <Card>
              <Pressable
                accessibilityRole={item.kind === 'journal' ? 'button' : 'text'}
                disabled={item.kind !== 'journal'}
                onPress={() => {
                  if (item.kind === 'journal') router.push(`/journal/${item.id}`);
                }}
                onLongPress={() => {
                  if (item.kind === 'journal') {
                    router.push(`/journal/${item.id}`);
                  }
                }}
                testID={`timeline-${item.kind}-${item.id}`}
              >
                <Text style={styles.timelineDate}>
                  {item.occurredAt.slice(0, 10)} ·{' '}
                  {item.kind === 'journal'
                    ? tr.archive.kindJournal
                    : item.kind === 'skill_observation'
                      ? tr.archive.kindSkill
                      : tr.archive.kindSession}
                </Text>
                {item.title ? (
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                ) : null}
                <Text style={styles.timelinePreview} numberOfLines={2}>
                  {item.preview}
                </Text>
              </Pressable>
            </Card>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState title={tr.archive.timelineSection} description={tr.archive.timelineEmpty} />
          ) : (
            <Text style={styles.loading}>{tr.common.loading}</Text>
          )
        }
        onEndReached={() => {
          if (hasMore && !loading) void load(items.length);
        }}
        onEndReachedThreshold={0.4}
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  rowDesc: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineMarker: {
    width: 28,
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  timelineDate: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  timelineTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  timelinePreview: {
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
});
