/**
 * UUID v4 üretimi.
 * - Node/test ortamında globalThis.crypto.randomUUID kullanılır.
 * - React Native'de expo-crypto'nun randomUUID'sine düşer (lazy import ile;
 *   test ortamında native modül hiç yüklenmez).
 */
export function generateUuid(): string {
  const globalCrypto = globalThis.crypto as Crypto | undefined;
  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return globalCrypto.randomUUID();
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ExpoCrypto = require('expo-crypto') as { randomUUID(): string };
  return ExpoCrypto.randomUUID();
}
