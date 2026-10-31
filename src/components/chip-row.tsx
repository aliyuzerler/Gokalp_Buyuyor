import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, touchTarget, typography } from '@/theme/tokens';

export type ChipItem<K extends string> = {
  key: K;
  label: string;
};

type ChipRowProps<K extends string> = {
  items: ChipItem<K>[];
  selectedKey: K;
  onSelect: (key: K) => void;
};

/**
 * Yatay kaydırılabilir seçim çipleri (tür/filtre seçimi).
 */
export function ChipRow<K extends string>({ items, selectedKey, onSelect }: ChipRowProps<K>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const selected = item.key === selectedKey;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(item.key)}
            style={[styles.chip, selected && styles.chipSelected]}
            testID={`chip-${item.key}`}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    minHeight: touchTarget - 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.white,
  },
});
