import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, elevation, radius, spacing } from '@/theme/tokens';

type CardProps = PropsWithChildren<{
  /** Yumuşak gölge kullan (varsayılan açık). */
  raised?: boolean;
  testID?: string;
}>;

/**
 * Sıcak yüzeyli temel kart bileşeni.
 */
export function Card({ children, raised = false, testID }: CardProps) {
  return (
    <View style={[styles.base, raised && styles.raised]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  raised: {
    ...elevation.card,
    borderWidth: 0,
  },
});
