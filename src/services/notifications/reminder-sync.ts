import * as Notifications from 'expo-notifications';

import { RemindersRepository, type ReminderRow } from '@/database/repositories/reminders-repository';
import { scheduleReminder } from '@/services/notifications/notification-service';
import type { DatabaseDriver } from '@/database/types';

export type RescheduleReport = {
  checked: number;
  rescheduled: number;
  permissionDenied: boolean;
};

/**
 * Uygulama açılışında hatırlatmaları yeniden planlar:
 * - Gelecekteki etkin hatırlatmaların OS bildirim kimlikleri tazelenir.
 * - İzin kapalıysa hata üretmez; sadece rapor döner.
 */
export async function rescheduleRemindersOnStart(db: DatabaseDriver): Promise<RescheduleReport> {
  const repo = new RemindersRepository(db);
  const reminders = await repo.list(true);
  let rescheduled = 0;
  let permissionDenied = false;

  for (const reminder of reminders) {
    if (reminder.is_enabled !== 1) continue;
    const at = new Date(reminder.scheduled_at);
    if (at.getTime() <= Date.now()) continue;

    // Eski OS bildirimini iptal et (varsa), yeniden kur.
    if (reminder.notification_id) {
      try {
        await Notifications.cancelScheduledNotificationAsync(reminder.notification_id);
      } catch {
        // Zaten yok — sorun değil
      }
    }
    const result = await scheduleReminder({
      title: reminder.title,
      body: reminder.note ?? 'Gökalp Büyüyor hatırlatması',
      at,
    });
    if (result.ok) {
      await repo.update(reminder.id, { notificationId: result.notificationId });
      rescheduled += 1;
    } else if (result.reason === 'permission_denied') {
      permissionDenied = true;
    }
  }

  return { checked: reminders.length, rescheduled, permissionDenied };
}

/** Hatırlatma silme/iptal: OS bildirimini de kaldırır. */
export async function cancelReminderCompletely(db: DatabaseDriver, reminder: ReminderRow): Promise<void> {
  if (reminder.notification_id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.notification_id);
    } catch {
      // yok sayılır
    }
  }
  const repo = new RemindersRepository(db);
  await repo.remove(reminder.id);
}
