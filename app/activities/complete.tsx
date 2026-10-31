import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DateField } from '@/components/date-field';
import { Input } from '@/components/input';
import { ScreenHeader } from '@/components/screen-header';
import { usePlannedActivities } from '@/features/guide/use-guide';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Etkinlik oturumu ekranı: tamamlandı (gözlem notuyla), ertelendi, atlandı.
 */
export default function CompleteActivityScreen() {
  const params = useLocalSearchParams<{ plannedId?: string }>();
  const plannedId = typeof params.plannedId === 'string' ? params.plannedId : '';
  const { items, completeWithNote, setStatus } = usePlannedActivities();
  const planned = items.find((p) => p.id === plannedId) ?? null;

  const [happenedAt, setHappenedAt] = useState(todayIso());
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  if (!planned) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title={tr.guide.completeButton} onBack={() => router.back()} />
        <Text style={styles.loading}>{tr.common.loading}</Text>
      </SafeAreaView>
    );
  }

  const title = planned.activity_title ?? planned.custom_title ?? '';

  const complete = async () => {
    await completeWithNote(plannedId, happenedAt, note.trim() === '' ? null : note.trim());
    setMessage(tr.guide.statusUpdated);
    setTimeout(() => router.back(), 600);
  };

  const changeStatus = async (status: 'postponed' | 'skipped') => {
    await setStatus(plannedId, status);
    setMessage(tr.guide.statusUpdated);
    setTimeout(() => router.back(), 600);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={title} subtitle={tr.guide.completeButton} onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card>
            <Text style={styles.fieldLabel}>{tr.guide.planDateLabel}</Text>
            <DateField
              value={happenedAt}
              onChange={setHappenedAt}
              accessibilityLabel={tr.guide.planDateLabel}
              testID="complete-date"
            />
            <Input
              label={tr.guide.completeNoteLabel}
              value={note}
              onChangeText={setNote}
              placeholder={tr.guide.completeNotePlaceholder}
              multiline
              testID="complete-note"
            />
          </Card>

          {message ? (
            <View style={styles.messageBox} testID="complete-message">
              <Text style={styles.message}>{message}</Text>
            </View>
          ) : null}

          <Button label={tr.guide.completeButton} onPress={() => void complete()} testID="complete-save" />
          <View style={styles.gap} />
          <Button
            label={tr.guide.postponeButton}
            variant="secondary"
            onPress={() => void changeStatus('postponed')}
            testID="complete-postpone"
          />
          <View style={styles.gap} />
          <Button
            label={tr.guide.skipButton}
            variant="secondary"
            onPress={() => void changeStatus('skipped')}
            testID="complete-skip"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  fieldLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  messageBox: {
    backgroundColor: colors.sageLight,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  message: {
    ...typography.small,
    color: colors.text,
  },
  gap: {
    height: spacing.sm,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    padding: spacing.md,
  },
});
