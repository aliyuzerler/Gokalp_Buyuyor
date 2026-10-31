import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

type ScreenContainerProps = PropsWithChildren<{
  /**
   * Ekran içeriğinin alt sekmelerin üstüne taşmasını engellemek için
   * alt kenara ekstra boşluk bırakır.
   */
  footer?: ReactNode;
}>;

/**
 * Tüm sekmelerde tutarlı zemin, kenar boşluğu ve safe-area davranışı sağlar.
 */
export function ScreenContainer({ children, footer }: ScreenContainerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  footer: {
    padding: spacing.sm,
  },
});
