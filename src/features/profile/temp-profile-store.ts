/**
 * Faz 01 geçici profil deposu.
 * Kalıcı kayıt Faz 02'de SQLite'a taşınır; bu store yalnızca onboarding akışını
 * uçtan uca denemek içindir (uygulama kapanınca kaybolur).
 */
export type TempChildProfile = {
  displayName: string;
  birthDate: string; // YYYY-MM-DD
};

let tempProfile: TempChildProfile | null = null;

export function setTempProfile(profile: TempChildProfile): void {
  tempProfile = profile;
}

export function getTempProfile(): TempChildProfile | null {
  return tempProfile;
}

export function clearTempProfile(): void {
  tempProfile = null;
}
