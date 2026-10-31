import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { ScreenHeader } from '@/components/screen-header';
import { useReadyDb } from '@/database/db-provider';
import { RemindersRepository, type ReminderRow } from '@/database/repositories/reminders-repository';
import { scheduleReminder } from '@/services/notifications/notification-service';
import { cancelReminderCompletely } from '@/services/notifications/reminder-sync';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

function nextHourIso(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/**
 * Hatırlatmalar: yerel bildirim CRUD. İzin reddi/OS kapatması uygulamayı bozmaz.
 */
export default function RemindersScreen() {
  const db = useReadyDb();
  const repo = useMemo(() => new RemindersRepository(db), [db]);
  const [rows, setRows] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

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
    setIsError(false);
    setMessage(null);
    try {
      const at = nextHourIso(10, 0);
      const result = await scheduleReminder({
        title: title.trim(),
        body: note.trim() === '' ? 'Gökalp Büyüyor hatırlatması' : note.trim(),
        at,
      });
      await repo.create({
        title,
        note: note.trim() === '' ? null : note.trim(),
        scheduledAt: at,
        notificationId: result.ok ? result.notificationId : null,
      });
      if (!result.ok) {
        setIsError(false);
        setMessage('Bildirim izni verilmedi; hatırlatma kaydedildi ama bildirim gelmez.');
      }
      setTitle('');
      setNote('');
      await reload();
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : tr.common.errorGeneric);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Hatırlatmalar" onBack={() => router.back()} />
      <FlatList
        contentContainerStyle={styles.list}
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.rowHead}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>
                  {new Date(item.scheduled_at).toLocaleString('tr-TR')} ·{' '}
                  {item.is_enabled === 1 ? 'Açık' : 'Kapalı'}
                </Text>
                {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
              </View>
              <Switch
                value={item.is_enabled === 1}
                onValueChange={(v) => {
                  void repo.setEnabled(item.id, v).then(reload);
                }}
                testID={`reminder-switch-${item.id}`}
              />
            </View>
            <View style={styles.rowActions}>
              <Button
                label={tr.common.delete}
                variant="danger"
                onPress={() => {
                  void cancelReminderCompletely(db, item).then(reload);
                }}
                testID={`reminder-delete-${item.id}`}
              />
            </View>
          </Card>
        )}
        ListHeaderComponent={
          <Card>
            <Text style={styles.formTitle}>Yeni hatırlatma</Text>
            <Text style={styles.hint}>
              Hatırlatmalar ertesi uygun sabah 10:00 için kurulur ve yalnızca bu telefonda çalışır.
            </Text>
            <View style={styles.formGap} />
            <Input label="Başlık" value={title} onChangeText={setTitle} placeholder="Örn. Fotoğraf yedeği al" testID="reminder-title" />
            <Input label="Not (isteğe bağlı)" value={note} onChangeText={setNote} placeholder="Detay" testID="reminder-note" />
            {message ? (
              <View style={[styles.messageBox, isError && styles.messageBoxError]} testID="reminder-message">
                <Text style={isError ? styles.messageError : styles.message}>{message}</Text>
              </View>
            ) : null}
            <Button label="Hatırlatma kur" onPress={() => void save()} disabled={title.trim().length === 0} testID="reminder-save" />
          </Card>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.loading}>Henüz hatırlatma yok.</Text>
          ) : undefined
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
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  rowMeta: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowNote: {
    ...typography.small,
    color: colors.text,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  formTitle: {
    ...typography.heading,
    color: colors.text,
  },
  hint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  formGap: {
    height: spacing.xs,
  },
  messageBox: {
    backgroundColor: colors.sageLight,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
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
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
