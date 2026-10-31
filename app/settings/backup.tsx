import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { useBackup } from '@/features/backup/use-backup';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Yedekleme ve geri yükleme ekranı (Arşiv > Yedekleme).
 * Şifresiz yedek uyarısı kullanıcıya açıkça gösterilir.
 */
export default function BackupScreen() {
  const backup = useBackup();

  const confirmRestore = () => {
    Alert.alert(tr.backup.restoringConfirmTitle, tr.backup.restoringConfirmBody, [
      { text: tr.common.cancel, style: 'cancel' },
      {
        text: tr.backup.confirm,
        style: 'destructive',
        onPress: () => void backup.restoreFromPicker(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={tr.backup.title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.warningBox} accessibilityRole="text">
          <Text style={styles.warningText}>⚠️ {tr.backup.warning}</Text>
        </View>

        <SectionHeader title={tr.backup.createButton} subtitle={tr.backup.createDesc} />
        <Card>
          <Button
            label={tr.backup.createButton}
            onPress={() => void backup.createAndExport()}
            disabled={backup.busy}
            testID="backup-create"
          />
        </Card>

        <SectionHeader title={tr.backup.restoreButton} subtitle={tr.backup.restoreDesc} />
        <Card>
          <Button
            label={tr.backup.restoreButton}
            variant="secondary"
            onPress={confirmRestore}
            disabled={backup.busy}
            testID="backup-restore"
          />
        </Card>

        <Card>
          <Text style={styles.note}>{backup.platformNote}</Text>
        </Card>

        {backup.message ? (
          <View
            style={[styles.messageBox, backup.isError && styles.messageBoxError]}
            testID="backup-message"
          >
            <Text style={backup.isError ? styles.messageError : styles.message}>
              {backup.message}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  warningBox: {
    backgroundColor: colors.surfaceMuted,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    borderRadius: 12,
    padding: spacing.md,
  },
  warningText: {
    ...typography.small,
    color: colors.text,
    lineHeight: 20,
  },
  note: {
    ...typography.small,
    color: colors.textMuted,
    lineHeight: 20,
  },
  messageBox: {
    marginTop: spacing.md,
    backgroundColor: colors.sageLight,
    borderRadius: 12,
    padding: spacing.md,
  },
  messageBoxError: {
    backgroundColor: '#F6E4E1',
  },
  message: {
    ...typography.small,
    color: colors.text,
  },
  messageError: {
    ...typography.small,
    color: colors.danger,
  },
});
