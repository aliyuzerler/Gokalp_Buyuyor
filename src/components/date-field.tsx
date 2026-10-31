import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing, touchTarget, typography } from '@/theme/tokens';

type DateFieldProps = {
  value: string;
  onChange: (formatted: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * YYYY-MM-DD otomatik biçimleyen metin alanı.
 * Kullanıcı yalnızca rakam girer; alan biçimi kendisi tamamlar.
 */
export function DateField({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  accessibilityLabel,
  testID,
}: DateFieldProps) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  let display = digits;
  if (digits.length > 4) display = `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length > 6) display = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={display}
        onChangeText={(text) => onChange(normalizeDateInput(text))}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        maxLength={10}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      />
    </View>
  );
}

/**
 * Serbest metni rakamlara indirip YYYY-MM-DD biçimine çevirir.
 */
export function normalizeDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  let out = digits;
  if (digits.length > 4) out = `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length > 6) out = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  return out;
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  input: {
    minHeight: touchTarget,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.body,
    color: colors.text,
  },
});
