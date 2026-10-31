import { File } from 'expo-file-system';
import * as ExpoCrypto from 'expo-crypto';

import { legacy } from './legacy-adapter';

/**
 * Native dosya yardımcıları (yalnızca uygulama çalışma zamanında import edilir).
 */

export async function pathExists(uri: string): Promise<boolean> {
  const info = await legacy.getInfoAsync(uri);
  return Boolean(info.exists);
}

export async function ensureDirectory(uri: string): Promise<void> {
  const info = await legacy.getInfoAsync(uri);
  if (!info.exists) {
    await legacy.makeDirectoryAsync(uri, { intermediates: true });
  }
}

export async function deleteRecursively(uri: string): Promise<void> {
  const info = await legacy.getInfoAsync(uri);
  if (!info.exists) return;
  await legacy.deleteAsync(uri, { idempotent: true });
}

export async function listDirectory(uri: string): Promise<string[]> {
  const info = await legacy.getInfoAsync(uri);
  if (!info.exists || !info.isDirectory) return [];
  return legacy.readDirectoryAsync(uri);
}

export async function copyFileAsync(from: string, to: string): Promise<void> {
  await legacy.copyAsync({ from, to });
}

/** Dizin ağacını özyinelemeli kopyalar (dosya tabanlı; JS heap'e dosya yüklemez). */
export async function copyDirectoryRecursive(from: string, to: string): Promise<number> {
  const info = await legacy.getInfoAsync(from);
  if (!info.exists || !info.isDirectory) return 0;
  await ensureDirectory(to);
  const names = await listDirectory(from);
  let copied = 0;
  for (const name of names) {
    const childFrom = joinUri(from, name);
    const childTo = joinUri(to, name);
    const childInfo = await legacy.getInfoAsync(childFrom);
    if (childInfo.isDirectory) {
      copied += await copyDirectoryRecursive(childFrom, childTo);
    } else {
      await copyFileAsync(childFrom, childTo);
      copied += 1;
    }
  }
  return copied;
}

export async function walkFiles(uri: string): Promise<string[]> {
  const info = await legacy.getInfoAsync(uri);
  if (!info.exists) return [];
  if (!info.isDirectory) return [uri];
  const names = await listDirectory(uri);
  const files: string[] = [];
  for (const name of names) {
    files.push(...(await walkFiles(joinUri(uri, name))));
  }
  return files;
}

/** file:///a/b/c → a/b/c (rootUri'ye göre göreli yol). */
export function relativeTo(rootUri: string, fileUri: string): string {
  let root = rootUri;
  if (!root.endsWith('/')) root = `${root}/`;
  const rel = fileUri.startsWith(root) ? fileUri.slice(root.length) : fileUri.replace(/^file:\/\//, '');
  return decodeURIComponent(rel);
}

export function joinUri(base: string, ...parts: string[]): string {
  let out = base.endsWith('/') ? base.slice(0, -1) : base;
  for (const part of parts) {
    out = `${out}/${part.replace(/^\/+/, '')}`;
  }
  return out;
}

export async function writeFileText(uri: string, text: string): Promise<void> {
  await legacy.writeAsStringAsync(uri, text, { encoding: legacy.EncodingType.UTF8 });
}

export async function readFileText(uri: string): Promise<string> {
  return legacy.readAsStringAsync(uri, { encoding: legacy.EncodingType.UTF8 });
}

export async function fileBytes(uri: string): Promise<Uint8Array> {
  const file = new File(uri);
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function fileSizeBytes(uri: string): Promise<number> {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error(`Dosya yok: ${uri}`);
  }
  return file.size;
}

/** SHA-256 dosya özeti (bütünlük kontrolü; şifreleme değildir). */
export async function sha256File(uri: string): Promise<string> {
  const bytes = await fileBytes(uri);
  return sha256Bytes(bytes);
}

export async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const digest = await ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, bytes as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function freeDiskBytes(): Promise<number> {
  return legacy.getFreeDiskStorageAsync();
}
