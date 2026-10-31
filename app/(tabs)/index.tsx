import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { SectionHeader } from '@/components/section-header';
import { ScreenContainer } from '@/components/screen-container';
import { useProfile } from '@/features/profile/use-profile';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

export default function HomeScreen() {
  const { profile, loading, ageLabel } = useProfile();

  if (loading) {
    return (
      <ScreenContainer>
        <Text style={styles.subtitle}>{tr.common.loading}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.greetingBlock} testID="home-greeting">
        <Text style={styles.title}>{profile ? profile.display_name : tr.appName}</Text>
        {profile && ageLabel ? (
          <Text style={styles.subtitle}>
            {tr.home.agePrefix} {ageLabel}
          </Text>
        ) : (
          <Text style={styles.subtitle}>{tr.home.greeting}</Text>
        )}
      </View>

      {!profile && (
        <>
          <SectionHeader title={tr.home.setupPendingTitle} />
          <Card>
            <EmptyState
              emoji="🧸"
              title={tr.home.setupPendingTitle}
              description={tr.home.setupPendingDesc}
              action={
                <Button
                  label={tr.home.setupCta}
                  onPress={() => router.push('/onboarding')}
                  testID="home-open-onboarding"
                />
              }
            />
          </Card>
        </>
      )}

      <SectionHeader title={tr.tabs.home} subtitle={tr.home.placeholder} />
      <Card>
        <Text style={styles.hint}>{tr.home.placeholderHint}</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greetingBlock: {
    marginTop: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.primaryDark,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  hint: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
});
