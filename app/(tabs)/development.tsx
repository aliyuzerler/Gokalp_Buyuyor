import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { useDevelopmentAreas2 } from '@/features/development/use-development';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Gelişim merkezi: 10 alan, betimleyici sayılar (puan/skor yok).
 */
export default function DevelopmentScreen() {
  const { areas, loading } = useDevelopmentAreas2();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={tr.development.title} subtitle={tr.development.disclaimer} />

      <FlatList
        contentContainerStyle={styles.list}
        data={areas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/development/${item.slug}`)}
              style={styles.areaRow}
              testID={`area-${item.slug}`}
            >
              <View style={styles.areaText}>
                <Text style={styles.areaTitle}>{item.title}</Text>
                <Text style={styles.areaDesc} numberOfLines={2}>
                  {item.description ?? ''}
                </Text>
                <Text style={styles.areaCounts}>
                  {tr.development.areaSubtitle(item.skillCount, item.observationCount)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </Card>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.loading}>{tr.common.loading}</Text> : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaText: {
    flex: 1,
  },
  areaTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  areaDesc: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  areaCounts: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: 4,
    fontWeight: '600',
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
