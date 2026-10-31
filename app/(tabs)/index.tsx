import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { SectionHeader } from '@/components/section-header';
import { ScreenContainer } from '@/components/screen-container';
import { useProfile } from '@/features/profile/use-profile';
import { useJournal } from '@/features/journal/use-journal';
import { usePlannedActivities } from '@/features/guide/use-guide';
import {
  JOURNAL_ENTRY_TYPE_LABELS,
  type JournalEntryType,
} from '@/domain/journal-types';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

export default function HomeScreen() {
  const { profile, loading, ageLabel, reload: reloadProfile } = useProfile();
  const { entries, load: loadEntries } = useJournal();
  const { items: planned, loading: plannedLoading } = usePlannedActivities();
  const recent = entries.slice(0, 3);
  const upcoming = planned
    .filter((item) => item.status === 'planned')
    .slice(0, 2);

  // Sekmeye her dönüşte taze veri (Faz 4 akışı: son kayıtlar güncel kalsın).
  useFocusEffect(
    useCallback(() => {
      void reloadProfile();
      void loadEntries(0);
    }, [reloadProfile, loadEntries]),
  );

  if (loading) {
    return (
      <ScreenContainer>
        <Text style={styles.subtitle}>{tr.common.loading}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.greetingBlock} testID="home-greeting">
        <Text style={styles.title}>{profile ? profile.display_name : tr.appName}</Text>
        {profile && ageLabel ? (
          <Text style={styles.subtitle}>
            {tr.home.agePrefix} {ageLabel}
          </Text>
        ) : (
          <Text style={styles.subtitle}>{tr.home.greeting}</Text>
        )}
      </View>

      {!profile && (
        <>
          <SectionHeader title={tr.home.setupPendingTitle} />
          <Card>
            <EmptyState
              emoji="🧸"
              title={tr.home.setupPendingTitle}
              description={tr.home.setupPendingDesc}
              action={
                <Button
                  label={tr.home.setupCta}
                  onPress={() => router.push('/onboarding')}
                  testID="home-open-onboarding"
                />
              }
            />
          </Card>
        </>
      )}

      <SectionHeader title={tr.home.quickSection} />
      <View style={styles.quickGrid}>
        <QuickAction
          label={tr.home.quickNote}
          icon="pencil-outline"
          onPress={() => router.push('/journal/editor?type=free_note')}
          testID="home-quick-note"
        />
        <QuickAction
          label={tr.home.quickMemory}
          icon="heart-outline"
          onPress={() => router.push('/journal/editor?type=memory')}
          testID="home-quick-memory"
        />
        <QuickAction
          label={tr.home.quickObservation}
          icon="eye-outline"
          onPress={() => router.push('/journal/editor?type=observation')}
          testID="home-quick-observation"
        />
        <QuickAction
          label={tr.home.quickPhoto}
          icon="camera-outline"
          onPress={() => router.push('/media')}
          testID="home-quick-photo"
        />
      </View>

      <SectionHeader title={tr.home.recentSection} />
      {recent.length === 0 ? (
        <Card>
          <Text style={styles.hint}>{tr.home.recentEmpty}</Text>
        </Card>
      ) : (
        <View style={styles.recentList}>
          {recent.map((entry) => (
            <Card key={entry.id}>
              <Text style={styles.recentType}>
                {JOURNAL_ENTRY_TYPE_LABELS[entry.entry_type as JournalEntryType] ??
                  entry.entry_type}{' '}
                · {entry.occurred_at}
              </Text>
              {entry.title ? <Text style={styles.recentTitle}>{entry.title}</Text> : null}
              <Text style={styles.recentPreview} numberOfLines={2}>
                {entry.body}
              </Text>
            </Card>
          ))}
        </View>
      )}

      {!plannedLoading && upcoming.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <View style={styles.sectionGrow}>
              <SectionHeader title={tr.home.plannedSection} />
            </View>
            <Button
              label={tr.home.plannedSeeAll}
              variant="ghost"
              onPress={() => router.push('/activities/planned')}
              testID="home-planned-see-all"
            />
          </View>
          <View style={styles.recentList}>
            {upcoming.map((item) => (
              <Card key={item.id}>
                <Text style={styles.recentType}>
                  {item.planned_for ?? '—'}
                </Text>
                <Text style={styles.recentTitle}>
                  {item.activity_title ?? item.custom_title ?? 'Etkinlik'}
                </Text>
              </Card>
            ))}
          </View>
        </>
      )}

      <SectionHeader title={tr.home.suggestSection} />
      <Card>
        <Text style={styles.hint}>{tr.home.suggestHint}</Text>
        <View style={styles.suggestAction}>
          <Button
            label={tr.home.suggestCta}
            variant="secondary"
            onPress={() => router.push('/guide')}
            testID="home-open-guide"
          />
        </View>
      </Card>
    </ScreenContainer>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  icon: 'pencil-outline' | 'heart-outline' | 'eye-outline' | 'camera-outline';
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Button
      label={label}
      variant="secondary"
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={disabled ? `${label} (${tr.home.quickPhotoHint})` : label}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  greetingBlock: {
    marginTop: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.primaryDark,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  hint: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickItem: {
    width: '47%',
  },
  recentList: {
    gap: spacing.sm,
  },
  recentType: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  recentTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  recentPreview: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  sectionGrow: {
    flex: 1,
  },
  suggestAction: {
    marginTop: spacing.sm,
  },
});
