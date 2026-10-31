import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

import { Button } from '@/components/button';
import { DateField } from '@/components/date-field';
import { Input } from '@/components/input';
import { ScreenHeader } from '@/components/screen-header';
import { useProfile } from '@/features/profile/use-profile';
import type { ChildProfileInput, ChildProfileRow } from '@/database/repositories/child-profile-repository';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Çocuk profili düzenleme ekranı (Arşiv > Profil ve Ayarlar).
 * Profil fotoğrafı alanı Faz 07 (medya arşivi) ile aktif olacak.
 */
export default function ProfileSettingsScreen() {
  const { profile, loading, saveProfile, ageLabel } = useProfile();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title={tr.settings.profileTitle} />
        <Text style={styles.loading}>{tr.common.loading}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={tr.settings.profileTitle} onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {profile ? (
            <ProfileForm
              key={profile.id}
              profile={profile}
              ageLabel={ageLabel}
              saveProfile={saveProfile}
            />
          ) : (
            <Text style={styles.missing}>{tr.settings.profileMissing}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileForm({
  profile,
  ageLabel,
  saveProfile,
}: {
  profile: ChildProfileRow;
  ageLabel: string | null;
  saveProfile: (input: ChildProfileInput) => Promise<ChildProfileRow>;
}) {
  const [name, setName] = useState(profile.display_name);
  const [birthDate, setBirthDate] = useState(profile.birth_date);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaved(false);
    setError(null);
    setSaving(true);
    try {
      await saveProfile({ displayName: name, birthDate });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : tr.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <Input
        label={tr.settings.profileNameLabel}
        value={name}
        onChangeText={setName}
        hint={tr.settings.profileNameHint}
        testID="profile-name"
      />
      <View>
        <Text style={styles.fieldLabel}>{tr.settings.profileBirthLabel}</Text>
        <DateField
          value={birthDate}
          onChange={(text) => {
            setSaved(false);
            setError(null);
            setBirthDate(text);
          }}
          accessibilityLabel={tr.settings.profileBirthLabel}
          testID="profile-birth"
        />
        <Text style={styles.hint}>{tr.settings.profileBirthHint}</Text>
        {ageLabel ? (
          <Text style={styles.ageNote}>
            {tr.home.agePrefix} {ageLabel}
          </Text>
        ) : null}
      </View>

      <View style={styles.photoBlock} testID="profile-photo-block">
        <Text style={styles.photoTitle}>{tr.settings.profilePhotoLabel}</Text>
        <Text style={styles.photoNote}>{tr.settings.profilePhotoLater}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saved ? <Text style={styles.saved}>{tr.settings.profileSaved}</Text> : null}

      <View style={styles.actions}>
        <Button
          label={tr.common.save}
          onPress={() => void save()}
          disabled={name.trim().length === 0 || birthDate.length !== 10 || saving}
          testID="profile-save"
        />
      </View>
    </View>
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
  form: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  hint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  ageNote: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  photoBlock: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    padding: spacing.md,
  },
  photoTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  photoNote: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  saved: {
    ...typography.small,
    color: colors.sage,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.lg,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    padding: spacing.md,
  },
  missing: {
    ...typography.body,
    color: colors.textMuted,
    padding: spacing.md,
  },
});
