import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { ChipRow } from '@/components/chip-row';
import { DateField } from '@/components/date-field';
import { Input } from '@/components/input';
import { ScreenHeader } from '@/components/screen-header';
import { useReadyDb } from '@/database/db-provider';
import { JournalRepository } from '@/database/repositories/journal-repository';
import { useDevelopmentAreas } from '@/features/development/use-development-areas';
import {
  JOURNAL_ENTRY_TYPES,
  JOURNAL_ENTRY_TYPE_LABELS,
  type JournalEntryType,
} from '@/domain/journal-types';
import { tr } from '@/i18n/tr';
import { colors, radius, spacing, typography } from '@/theme/tokens';

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Yeni kayıt / düzenleme ekranı. Parametreler:
 * - type: başlangıç kayıt türü (memory, observation, ...)
 * - id: varsa düzenleme modu
 */
export default function JournalEditorScreen() {
  const params = useLocalSearchParams<{ type?: string; id?: string }>();
  const editId = typeof params.id === 'string' ? params.id : undefined;
  const initialType = (JOURNAL_ENTRY_TYPES as readonly string[]).includes(params.type ?? '')
    ? (params.type as JournalEntryType)
    : 'memory';

  const db = useReadyDb();
  const repository = useMemo(() => new JournalRepository(db), [db]);
  const { areas } = useDevelopmentAreas();

  const [entryType, setEntryType] = useState<JournalEntryType>(initialType);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [occurredAt, setOccurredAt] = useState(todayIso());
  const [areaId, setAreaId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Düzenleme modunda kaydı doğrudan DB'den yükle.
  useEffect(() => {
    if (!editId) return;
    let active = true;
    repository
      .get(editId)
      .then((entry) => {
        if (!active || !entry) return;
        setEntryType(entry.entry_type as JournalEntryType);
        setTitle(entry.title ?? '');
        setBody(entry.body);
        setOccurredAt(entry.occurred_at);
        setAreaId(entry.area_id);
        setTags(entry.tags);
      })
      .catch(() => {
        if (active) setError(tr.common.errorGeneric);
      });
    return () => {
      active = false;
    };
  }, [editId, repository]);

  const addTag = () => {
    const value = tagDraft.trim();
    if (value.length === 0) return;
    if (!tags.includes(value) && tags.length < 20) {
      setTags([...tags, value]);
    }
    setTagDraft('');
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      if (editId) {
        await repository.update(editId, {
          entryType,
          title: title.trim() === '' ? null : title.trim(),
          body: body.trim(),
          occurredAt,
          areaId,
          tags,
        });
      } else {
        await repository.create({
          entryType,
          title: title.trim() === '' ? null : title.trim(),
          body: body.trim(),
          occurredAt,
          areaId,
          tags,
        });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const areaItems = [
    { key: '__none__', label: tr.journal.areaNone },
    ...areas.map((a) => ({ key: a.id, label: a.title })),
  ];
  const selectedAreaKey = areaId ?? '__none__';

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title={editId ? tr.journal.editTitle : tr.journal.newTitle}
        onBack={() => router.back()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>{tr.journal.typeLabel}</Text>
          <ChipRow<JournalEntryType>
            items={JOURNAL_ENTRY_TYPES.map((t) => ({
              key: t,
              label: JOURNAL_ENTRY_TYPE_LABELS[t],
            }))}
            selectedKey={entryType}
            onSelect={setEntryType}
          />

          <Input
            label={tr.journal.titleLabel}
            value={title}
            onChangeText={setTitle}
            placeholder={tr.journal.titlePlaceholder}
            testID="journal-title"
          />

          <Input
            label={tr.journal.bodyLabel}
            value={body}
            onChangeText={setBody}
            placeholder={tr.journal.bodyPlaceholder}
            multiline
            testID="journal-body"
          />

          <View>
            <Text style={styles.fieldLabel}>{tr.journal.occurredLabel}</Text>
            <DateField
              value={occurredAt}
              onChange={(text) => setOccurredAt(text)}
              accessibilityLabel={tr.journal.occurredLabel}
              testID="journal-occurred"
            />
            <Text style={styles.hint}>{tr.journal.occurredHint}</Text>
          </View>

          <Text style={styles.fieldLabel}>{tr.journal.areaLabel}</Text>
          <ChipRow
            items={areaItems}
            selectedKey={selectedAreaKey}
            onSelect={(key) => setAreaId(key === '__none__' ? null : key)}
          />

          <Text style={styles.fieldLabel}>{tr.journal.tagsLabel}</Text>
          <View style={styles.tagRow}>
            <View style={styles.tagInputWrap}>
              <Input
                value={tagDraft}
                onChangeText={setTagDraft}
                placeholder={tr.journal.tagsPlaceholder}
                testID="journal-tag-input"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={addTag}
              style={styles.tagAdd}
              testID="journal-tag-add"
            >
              <Text style={styles.tagAddText}>{tr.journal.tagsAdd}</Text>
            </Pressable>
          </View>
          {tags.length > 0 ? (
            <View style={styles.tagChips}>
              {tags.map((t) => (
                <Pressable
                  key={t}
                  accessibilityRole="button"
                  onPress={() => setTags(tags.filter((x) => x !== t))}
                  style={styles.tagChip}
                >
                  <Text style={styles.tagChipText}>{t} ✕</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.hint}>{tr.journal.occurredHint}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              label={tr.common.save}
              onPress={() => void save()}
              disabled={body.trim().length === 0 || saving || occurredAt.length !== 10}
              testID="journal-save"
            />
          </View>
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
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  hint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tagInputWrap: {
    flex: 1,
  },
  tagAdd: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginLeft: spacing.sm,
    backgroundColor: colors.sageLight,
    borderRadius: radius.md,
  },
  tagAddText: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  tagChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tagChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  tagChipText: {
    ...typography.small,
    color: colors.text,
  },
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.lg,
  },
});
