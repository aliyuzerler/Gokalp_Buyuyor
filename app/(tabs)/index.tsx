import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

export default function HomeScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>{tr.appName}</Text>
      <Text style={styles.subtitle}>{tr.home.placeholder}</Text>
      <Text style={styles.hint}>{tr.home.placeholderHint}</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.primaryDark,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
