import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { useDatabase } from '@/database/db-provider';
import { tr } from '@/i18n/tr';
import {
  cleanupBackupStaging,
  createBackup,
  exportBackupFile,
} from '@/services/backup/backup-service';
import { pickBackupFile, restoreFromUri } from '@/services/backup/restore-service';

export type BackupUiState = {
  busy: boolean;
  message: string | null;
  isError: boolean;
};

/**
 * Yedekle/geri yükle feature hook'u: UI → servis akışı. UI dosya sistemi işlemleri yapmaz.
 * Not: dışa aktarım başarı mesajı yalnızca yedek dosyası hazır olduğunda verilir;
 * kullanıcı paylaşım/konum adımını iptal ederse sahte başarı gösterilmez.
 */
export function useBackup() {
  const { withDbClosed } = useDatabase();
  const [state, setState] = useState<BackupUiState>({ busy: false, message: null, isError: false });

  const createAndExport = useCallback(async () => {
    setState({ busy: true, message: tr.backup.creating, isError: false });
    try {
      const result = await createBackup({ withDbClosed });
      setState({
        busy: false,
        message: tr.backup.createdReady(result.fileName, result.sizeBytes),
        isError: false,
      });
      // Kullanıcı paylaşım/konum seçimini iptal edebilmesine rağmen dosya hazır;
      // burada "kaydedildi" iddiası yapılmaz.
      await exportBackupFile(result.fileUri).catch(() => undefined);
      await cleanupBackupStaging();
      return result;
    } catch (error) {
      setState({
        busy: false,
        isError: true,
        message: error instanceof Error ? error.message : tr.common.errorGeneric,
      });
      return null;
    }
  }, [withDbClosed]);

  const restoreFromPicker = useCallback(async () => {
    setState({ busy: true, message: tr.backup.picking, isError: false });
    const picked = await pickBackupFile();
    if (picked.canceled) {
      setState({ busy: false, message: null, isError: false });
      return null;
    }
    if (!picked.fileName.endsWith('.gokalpbackup')) {
      setState({
        busy: false,
        isError: true,
        message: tr.backup.wrongExtension,
      });
      return null;
    }
    try {
      const outcome = await restoreFromUri(picked.fileUri, { withDbClosed });
      if (!outcome.ok) {
        setState({ busy: false, isError: true, message: outcome.reason });
        return null;
      }
      setState({
        busy: false,
        isError: false,
        message: tr.backup.restored(outcome.entryCount),
      });
      return outcome;
    } catch (error) {
      setState({
        busy: false,
        isError: true,
        message: error instanceof Error ? error.message : tr.common.errorGeneric,
      });
      return null;
    }
  }, [withDbClosed]);

  const reset = useCallback(() => {
    setState({ busy: false, message: null, isError: false });
  }, []);

  const platformNote = Platform.OS === 'android' ? tr.backup.androidNote : tr.backup.iosNote;

  return { ...state, createAndExport, restoreFromPicker, reset, platformNote };
}
