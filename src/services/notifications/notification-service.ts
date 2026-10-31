/**
 * Yerel bildirim servisi (expo-notifications).
 * İzin akışı yalnızca kullanıcı hatırlatma oluşturduğunda başlatılır.
 * İzin reddedilirse uygulama normal çalışmaya devam eder.
 */
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { Platform } from 'react-native';

export type ReminderScheduleResult =
  | { ok: true; notificationId: string }
  | { ok: false; reason: 'permission_denied' | 'unavailable' };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Bildirim izni durumunu sorgular; kullanıcı istemedikçe izin isteği başlatmaz. */
export async function getPermissionStatus(): Promise<
  'granted' | 'denied' | 'undetermined' | 'unavailable'
> {
  const settings = await Notifications.getPermissionsAsync();
  if (!settings) return 'unavailable';
  if (settings.granted) return 'granted';
  if (!settings.canAskAgain) return 'denied';
  return 'undetermined';
}

/** Kullanıcı hatırlatma isterse: izin iste + planla. Reddedilirse uygulama devam eder. */
export async function scheduleReminder(input: {
  title: string;
  body: string;
  at: Date;
}): Promise<ReminderScheduleResult> {
  try {
    const status = await getPermissionStatus();
    let effective = status;
    if (status === 'undetermined') {
      const request = await Notifications.requestPermissionsAsync();
      effective = request.granted ? 'granted' : 'denied';
    }
    if (effective !== 'granted') {
      return { ok: false, reason: 'permission_denied' };
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Hatırlatmalar',
        importance: AndroidImportance.HIGH,
        lightColor: '#A77C5C',
      });
    }
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: input.title, body: input.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: input.at },
    });
    return { ok: true, notificationId: id };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Zaten tetiklenmiş/iptal edilmiş olabilir; sessiz geç.
  }
}
