import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button } from '@/components/button';
import { DateField } from '@/components/date-field';
import { Input } from '@/components/input';
import { makeBirthDateSchema } from '@/domain/birth-date';
import { useProfile } from '@/features/profile/use-profile';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

type Step = 'welcome' | 'profile' | 'done';

const DEFAULT_NAME = 'Gökalp';

/**
 * İlk kurulum akışı. Faz 02'den itibaren profil SQLite'a kalıcı yazılır.
 */
export default function OnboardingScreen() {
  const { saveProfile } = useProfile();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState(DEFAULT_NAME);
  const [birthDate, setBirthDate] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);

  const today = new Date();
  const birthSchema = makeBirthDateSchema(today);
  const birthValidation = birthSchema.safeParse(birthDate);
  const birthError =
    touched && !birthValidation.success ? (birthValidation.error.issues[0]?.message ?? null) : null;

  const proceedFromProfile = useCallback(async () => {
    setTouched(true);
    if (!birthValidation.success || name.trim().length === 0) return;
    setSaving(true);
    try {
      await saveProfile({ displayName: name.trim(), birthDate });
      setStep('done');
    } catch (error) {
      // Kullanıcıya Türkçe mesaj; teknik detay yerel logda.
      const message = error instanceof Error ? error.message : tr.common.errorGeneric;
      setTouched(true);
      setBirthDateError(message);
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthValidation.success, name, saveProfile]);

  const shownBirthError = birthError ?? birthDateError;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 'welcome' && (
            <View>
              <Text style={styles.stepLabel}>{tr.onboarding.welcomeStep}</Text>
              <Text style={styles.title}>{tr.onboarding.welcomeTitle}</Text>
              <Text style={styles.body}>{tr.onboarding.welcomeBody}</Text>
              <View style={styles.actions}>
                <Button
                  label={tr.common.next}
                  onPress={() => setStep('profile')}
                  testID="onboarding-welcome-next"
                />
              </View>
            </View>
          )}

          {step === 'profile' && (
            <View>
              <Text style={styles.stepLabel}>{tr.onboarding.profileStep}</Text>
              <Text style={styles.title}>{tr.onboarding.profileTitle}</Text>
              <View style={styles.form}>
                <Input
                  label={tr.onboarding.profileNameLabel}
                  value={name}
                  onChangeText={setName}
                  placeholder={tr.onboarding.profileNamePlaceholder}
                  testID="onboarding-name"
                />
                <View>
                  <Text style={styles.fieldLabel}>{tr.onboarding.profileBirthLabel}</Text>
                  <DateField
                    value={birthDate}
                    onChange={(text) => {
                      setTouched(true);
                      setBirthDateError(null);
                      setBirthDate(text);
                    }}
                    accessibilityLabel={tr.onboarding.profileBirthLabel}
                    testID="onboarding-birth"
                  />
                  {shownBirthError ? (
                    <Text style={styles.error} testID="onboarding-birth-error">
                      {shownBirthError}
                    </Text>
                  ) : (
                    <Text style={styles.hint}>{tr.onboarding.profileBirthHint}</Text>
                  )}
                </View>
                <Text style={styles.note}>{tr.onboarding.profileAvatarNote}</Text>
              </View>
              <View style={styles.actionsRow}>
                <Button
                  label={tr.common.back}
                  variant="ghost"
                  onPress={() => setStep('welcome')}
                  testID="onboarding-back"
                />
                <Button
                  label={tr.common.next}
                  onPress={() => void proceedFromProfile()}
                  disabled={!birthValidation.success || name.trim().length === 0 || saving}
                  testID="onboarding-profile-next"
                />
              </View>
            </View>
          )}

          {step === 'done' && (
            <View>
              <Text style={styles.stepLabel}>{tr.onboarding.doneStep}</Text>
              <Text style={styles.title}>{tr.onboarding.doneTitle}</Text>
              <View style={styles.summaryCard} testID="onboarding-summary">
                <Text style={styles.summaryText}>
                  {tr.onboarding.doneSummaryPrefix} {name.trim()} · {birthDate}
                </Text>
              </View>
              <View style={styles.actions}>
                <Button
                  label={tr.onboarding.doneCta}
                  onPress={() => router.replace('/(tabs)')}
                  testID="onboarding-finish"
                />
              </View>
            </View>
          )}
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
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stepLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  title: {
    ...typography.title,
    color: colors.primaryDark,
  },
  body: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    lineHeight: 24,
  },
  form: {
    marginTop: spacing.lg,
  },
  fieldLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  note: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  hint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.xl,
  },
  actionsRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    marginTop: spacing.md,
    backgroundColor: colors.sageLight,
    borderRadius: 16,
    padding: spacing.md,
  },
  summaryText: {
    ...typography.body,
    color: colors.text,
  },
});
