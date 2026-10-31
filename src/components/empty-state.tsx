import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type EmptyStateProps = {
  /** Basit emoji/ikon temsili; çizgi film estetiği kaçınılır. */
  emoji?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

/**
 * Açıklayıcı ve teşvik edici boş durum. Suçlayıcı dil kullanılmaz.
 */
export function EmptyState({ emoji = '🌱', title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji} accessibilityLabel="">
        {emoji}
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
  },
  emoji: {
    fontSize: 34,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  action: {
    marginTop: spacing.md,
    minWidth: 200,
  },
});
