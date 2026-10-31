import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ArchiveScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>{tr.tabs.archive}</Text>
      <Text style={styles.subtitle}>{tr.archive.placeholder}</Text>
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
});
