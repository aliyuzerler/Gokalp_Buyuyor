import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DateField } from '@/components/date-field';
import { ScreenHeader } from '@/components/screen-header';
import { useReadyDb } from '@/database/db-provider';
import { PlannedActivitiesRepository } from '@/database/repositories/guide-repository';
import { useActivity } from '@/features/guide/use-guide';
import { scheduleReminder } from '@/services/notifications/notification-service';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Etkinlik planlama ekranı: tarih + opsiyonel yerel bildirim hatırlatması.
 * Bildirim izni yalnızca hatırlatma kurma onayındayken istenir; reddedilse plan yine oluşur.
 */
export default function PlanActivityScreen() {
  const params = useLocalSearchParams<{ activityId?: string }>();
  const activityId = typeof params.activityId === 'string' ? params.activityId : '';
  const db = useReadyDb();
  const plannedRepo = useMemo(() => new PlannedActivitiesRepository(db), [db]);
  const { activity } = useActivity(activityId || null);

  const [plannedFor, setPlannedFor] = useState(todayIso());
  const [withReminder, setWithReminder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setIsError(false);
    setMessage(null);
    setSaving(true);
    try {
      const title = activity?.title ?? 'Etkinlik';
      let reminderId: string | null = null;
      if (withReminder) {
        const at = new Date(`${plannedFor}T10:00:00`);
        const result = await scheduleReminder({
          title: 'Gökalp Büyüyor',
          body: `Planlanan etkinlik: ${title}`,
          at,
        });
        if (result.ok) {
          reminderId = result.notificationId;
        } else {
          setMessage(tr.guide.reminderDenied);
        }
      }
      await plannedRepo.create({
        activityId: activity?.id ?? null,
        customTitle: activity ? null : title,
        plannedFor,
        reminderId,
      });
      setMessage(isError ? message : tr.guide.planSaved);
      if (!isError) {
        // Kullanıcıyı rehbere geri götür
        setTimeout(() => router.back(), 600);
      }
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : tr.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  if (!activity) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title={tr.guide.planButton} onBack={() => router.back()} />
        <Text style={styles.loading}>{tr.common.errorGeneric}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={tr.guide.planButton} subtitle={activity.title} onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card>
            <Text style={styles.fieldLabel}>{tr.guide.planDateLabel}</Text>
            <DateField
              value={plannedFor}
              onChange={setPlannedFor}
              accessibilityLabel={tr.guide.planDateLabel}
              testID="plan-date"
            />
            <View style={styles.reminderRow}>
              <View style={styles.reminderText}>
                <Text style={styles.reminderTitle}>{tr.guide.planReminderLabel}</Text>
                <Text style={styles.reminderDesc}>{tr.guide.planReminderDesc}</Text>
              </View>
              <Switch
                value={withReminder}
                onValueChange={setWithReminder}
                testID="plan-reminder-switch"
              />
            </View>
          </Card>

          {message ? (
            <View style={[styles.messageBox, isError && styles.messageBoxError]} testID="plan-message">
              <Text style={isError ? styles.messageError : styles.message}>{message}</Text>
            </View>
          ) : null}

          <Button
            label={tr.guide.planButton}
            onPress={() => void save()}
            disabled={saving || plannedFor.length !== 10}
            testID="plan-save"
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
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  reminderText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  reminderTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  reminderDesc: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  messageBox: {
    backgroundColor: colors.sageLight,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
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
  loading: {
    ...typography.body,
    color: colors.textMuted,
    padding: spacing.md,
  },
});
