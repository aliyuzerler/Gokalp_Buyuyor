import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Card } from '@/components/card';
import { SectionHeader } from '@/components/section-header';
import { ScreenContainer } from '@/components/screen-container';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ArchiveScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>{tr.tabs.archive}</Text>
      <Text style={styles.subtitle}>{tr.archive.placeholder}</Text>

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
          <Text style={styles.chevron}>›</Text>
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
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
  },
});
