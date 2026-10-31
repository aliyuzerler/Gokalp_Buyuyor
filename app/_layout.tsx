import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DatabaseProvider, useDatabase } from '@/database/db-provider';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

export const unstable_settings = {
  anchor: '(tabs)',
};

function DatabaseGate({ children }: { children: React.ReactNode }) {
  const { status, error } = useDatabase();

  if (status === 'loading') {
    return (
      <View style={gateStyles.center}>
        <Text style={gateStyles.title}>{tr.appName}</Text>
        <Text style={gateStyles.body}>{tr.common.dbLoadingTitle}…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={gateStyles.center}>
        <Text style={gateStyles.title}>{tr.common.dbErrorTitle}</Text>
        <Text style={gateStyles.errorText}>{error}</Text>
        <Text style={gateStyles.body}>{tr.common.errorGeneric}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  void useColorScheme();
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      primary: colors.primary,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <DatabaseProvider>
        <DatabaseGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="settings" />
          </Stack>
        </DatabaseGate>
      </DatabaseProvider>
    </ThemeProvider>
  );
}

const gateStyles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.primaryDark,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.md,
  },
});
