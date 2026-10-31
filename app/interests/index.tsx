import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { DateField } from '@/components/date-field';
import { EmptyState } from '@/components/empty-state';
import { Input } from '@/components/input';
import { ScreenHeader } from '@/components/screen-header';
import {
  InterestAreasRepository,
  type InterestAreaRow,
} from '@/database/repositories/interests-repository';
import { useReadyDb } from '@/database/db-provider';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * İlgi alanları: ebeveyn tanımlar, pasifleştirir; sistem öneri yapmaz.
 */
export default function InterestsScreen() {
  const db = useReadyDb();
  const repo = useMemo(() => new InterestAreasRepository(db), [db]);
  const [rows, setRows] = useState<InterestAreaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [firstObserved, setFirstObserved] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setRows(await repo.list(true));
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = async () => {
    setError(null);
    try {
      if (editingId) {
        await repo.update(editingId, {
          title,
          description: description.trim() === '' ? null : description.trim(),
          firstObservedOn: firstObserved.length === 10 ? firstObserved : null,
        });
      } else {
        await repo.create({
          title,
          description: description.trim() === '' ? null : description.trim(),
          firstObservedOn: firstObserved.length === 10 ? firstObserved : null,
        });
      }
      setTitle('');
      setDescription('');
      setFirstObserved('');
      setEditingId(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr.common.errorGeneric);
    }
  };

  const startEdit = (row: InterestAreaRow) => {
    setEditingId(row.id);
    setTitle(row.title);
    setDescription(row.description ?? '');
    setFirstObserved(row.first_observed_on ?? '');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="İlgi alanları" onBack={() => router.back()} />
      <FlatList
        contentContainerStyle={styles.list}
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.rowHead}>
              <Text style={[styles.rowTitle, item.is_active === 0 && styles.inactive]}>
                {item.title}
              </Text>
              <Switch
                value={item.is_active === 1}
                onValueChange={(v) => {
                  void repo.setActive(item.id, v).then(reload);
                }}
                testID={`interest-switch-${item.id}`}
              />
            </View>
            {item.description ? <Text style={styles.rowDesc}>{item.description}</Text> : null}
            <Text style={styles.rowDates}>
              {item.first_observed_on ? `İlk: ${item.first_observed_on}` : 'İlk gözlem tarihi yok'}
              {item.last_observed_on ? ` · Son: ${item.last_observed_on}` : ''}
            </Text>
            <View style={styles.rowActions}>
              <Button
                label={tr.common.edit}
                variant="ghost"
                onPress={() => startEdit(item)}
                testID={`interest-edit-${item.id}`}
              />
            </View>
          </Card>
        )}
        ListHeaderComponent={
          <Card>
            <Text style={styles.formTitle}>
              {editingId ? 'İlgi alanını düzenle' : 'Yeni ilgi alanı'}
            </Text>
            <Input
              label="Başlık"
              value={title}
              onChangeText={setTitle}
              placeholder="Örn. Müzik, hayvanlar, arabalar"
              testID="interest-title"
            />
            <Input
              label="Açıklama (isteğe bağlı)"
              value={description}
              onChangeText={setDescription}
              placeholder="Ne fark ettin?"
              multiline
              testID="interest-description"
            />
            <Text style={styles.fieldLabel}>İlk gözlem tarihi (isteğe bağlı)</Text>
            <DateField
              value={firstObserved}
              onChange={setFirstObserved}
              testID="interest-first-observed"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={editingId ? tr.common.save : 'Ekle'}
              onPress={() => void save()}
              disabled={title.trim().length === 0}
              testID="interest-save"
            />
          </Card>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="İlgi alanları"
              description="Gökalp'in merak ettiği şeyleri burada biriktirebilirsin. Sistem öneri yapmaz; kayıtlar tamamen sana aittir."
            />
          ) : (
            <Text style={styles.loading}>{tr.common.loading}</Text>
          )
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
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  inactive: {
    color: colors.textMuted,
  },
  rowDesc: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowDates: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: 4,
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  formTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  error: {
    ...typography.small,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
