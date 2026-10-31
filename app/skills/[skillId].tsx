import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ChipRow } from '@/components/chip-row';
import { DateField } from '@/components/date-field';
import { Input } from '@/components/input';
import { ScreenHeader } from '@/components/screen-header';
import { useReadyDb } from '@/database/db-provider';
import {
  SkillsRepository,
  type SkillObservationRow,
  type SkillWithArea,
} from '@/database/repositories/skills-repository';
import {
  SKILL_OBSERVATION_STATUSES,
  SKILL_OBSERVATION_STATUS_LABELS,
  type SkillObservationStatus,
} from '@/domain/journal-types';
import { tr } from '@/i18n/tr';
import { colors, radius, spacing, typography } from '@/theme/tokens';

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Beceri detayı: açıklama, kaynak ve tarihli gözlem geçmişi.
 * Durumlar puan/rozet değil, ebeveynin ifadesidir ("gözlemledim").
 */
export default function SkillDetailScreen() {
  const params = useLocalSearchParams<{ skillId?: string }>();
  const skillId = typeof params.skillId === 'string' ? params.skillId : '';
  const db = useReadyDb();
  const repo = useMemo(() => new SkillsRepository(db), [db]);

  const [skill, setSkill] = useState<SkillWithArea | null>(null);
  const [observations, setObservations] = useState<SkillObservationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [obsDate, setObsDate] = useState(todayIso());
  const [obsStatus, setObsStatus] = useState<SkillObservationStatus>('not_tried');
  const [obsNote, setObsNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    try {
      const row = await repo.byId(skillId);
      setSkill(row);
      if (row) {
        setObservations(await repo.observations(row.id));
      }
    } finally {
      setLoading(false);
    }
  }, [repo, skillId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveObservation = async () => {
    if (!skill) return;
    setError(null);
    setSaving(true);
    try {
      await repo.addObservation({
        skillId: skill.id,
        observedOn: obsDate,
        status: obsStatus,
        note: obsNote.trim() === '' ? null : obsNote.trim(),
      });
      setObsNote('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !skill) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title={tr.development.skillsTitle} onBack={() => router.back()} />
        <Text style={styles.loading}>{loading ? tr.common.loading : tr.common.errorGeneric}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={skill.title} subtitle={skill.area_title} onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card>
            {skill.description ? <Text style={styles.description}>{skill.description}</Text> : null}
            <Text style={styles.ageRange}>
              {tr.development.ageRange(skill.min_age_months, skill.max_age_months)}
            </Text>
            {skill.source_name ? (
              <View style={styles.sourceBlock}>
                <Text style={styles.sourceLabel}>{tr.development.sourceLabel}</Text>
                <Text style={styles.sourceText}>{skill.source_name}</Text>
                {skill.reviewed_at ? (
                  <Text style={styles.sourceText}>
                    {tr.development.reviewedAtLabel}: {skill.reviewed_at}
                  </Text>
                ) : null}
              </View>
            ) : null}
            <Text style={styles.disclaimer}>{tr.development.disclaimer}</Text>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>{tr.development.addObservation}</Text>
            <Text style={styles.fieldLabel}>{tr.development.observationDateLabel}</Text>
            <DateField
              value={obsDate}
              onChange={setObsDate}
              accessibilityLabel={tr.development.observationDateLabel}
              testID="skill-obs-date"
            />
            <ChipRow<SkillObservationStatus>
              items={SKILL_OBSERVATION_STATUSES.map((s) => ({
                key: s,
                label: SKILL_OBSERVATION_STATUS_LABELS[s],
              }))}
              selectedKey={obsStatus}
              onSelect={setObsStatus}
            />
            <Input
              label={tr.development.observationNoteLabel}
              value={obsNote}
              onChangeText={setObsNote}
              placeholder={tr.development.observationNotePlaceholder}
              multiline
              testID="skill-obs-note"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={tr.development.addObservation}
              onPress={() => void saveObservation()}
              disabled={saving || obsDate.length !== 10}
              testID="skill-obs-save"
            />
          </Card>

          <Text style={styles.historyTitle}>
            {tr.development.observationHistory} ({observations.length})
          </Text>
          {observations.length === 0 ? (
            <Card>
              <Text style={styles.emptyHistory}>{tr.development.noObservations}</Text>
            </Card>
          ) : (
            <View style={styles.historyList}>
              {observations.map((obs) => (
                <Card key={obs.id}>
                  <View style={styles.obsHeader}>
                    <Text style={styles.obsDate}>{obs.observed_on}</Text>
                    <View style={styles.statusBadge} testID={`obs-status-${obs.status}`}>
                      <Text style={styles.statusBadgeText}>
                        {SKILL_OBSERVATION_STATUS_LABELS[obs.status]}
                      </Text>
                    </View>
                  </View>
                  {obs.note ? <Text style={styles.obsNote}>{obs.note}</Text> : null}
                </Card>
              ))}
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
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  ageRange: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  sourceBlock: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  sourceLabel: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sourceText: {
    ...typography.small,
    color: colors.text,
    marginTop: 2,
  },
  disclaimer: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  fieldLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  error: {
    ...typography.small,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  historyTitle: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
  },
  historyList: {
    gap: spacing.sm,
  },
  obsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  obsDate: {
    ...typography.small,
    color: colors.textMuted,
  },
  statusBadge: {
    backgroundColor: colors.sageLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  obsNote: {
    ...typography.small,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  emptyHistory: {
    ...typography.body,
    color: colors.textMuted,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    padding: spacing.md,
  },
});
