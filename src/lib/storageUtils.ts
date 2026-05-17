/**
 * storageUtils.ts
 *
 * Kalpa Solar Power – Storage utility functions
 *
 * Centralizes path derivation and safe file movement logic.
 */

import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'drawing-files';

function normalizeStoragePath(folderPath: string): string {
  if (!folderPath || typeof folderPath !== 'string') {
    throw new Error(`[storageUtils] Invalid folder path: ${String(folderPath)}`);
  }

  return folderPath.trim().replace(/^\/+/, '');
}

function assertValidPath(folderPath: string): void {
  const normalized = normalizeStoragePath(folderPath);
  if (!normalized.includes('/')) {
    throw new Error(`[storageUtils] Invalid folder path: ${String(folderPath)}`);
  }
}

export function getStorageFileName(folderPath: string): string {
  const normalized = normalizeStoragePath(folderPath);
  const parts = normalized.split('/');
  const fileName = parts.pop();
  if (!fileName) {
    throw new Error(`[getStorageFileName] Could not parse file name from path: ${folderPath}`);
  }
  return fileName;
}

export function getStorageFolder(folderPath: string): string {
  const normalized = normalizeStoragePath(folderPath);
  const parts = normalized.split('/');
  parts.pop();
  return parts.join('/');
}

export function getApprovedPath(folderPath: string): string {
  const normalized = normalizeStoragePath(folderPath);
  if (normalized.includes('/approved/')) return normalized;
  if (normalized.includes('/working/')) {
    return normalized.replace('/working/', '/approved/');
  }
  if (normalized.includes('/archive/')) {
    return normalized.replace('/archive/', '/approved/');
  }
  throw new Error(`[getApprovedPath] Unable to derive approved path from: ${normalized}`);
}

export function getArchivePath(folderPath: string): string {
  const normalized = normalizeStoragePath(folderPath);
  if (normalized.includes('/archive/')) return normalized;
  if (normalized.includes('/working/')) {
    return normalized.replace('/working/', '/archive/');
  }
  if (normalized.includes('/approved/')) {
    return normalized.replace('/approved/', '/archive/');
  }
  throw new Error(`[getArchivePath] Unable to derive archive path from: ${normalized}`);
}

export function getSiblingStoragePath(folderPath: string): string | null {
  const normalized = normalizeStoragePath(folderPath);
  if (normalized.toLowerCase().endsWith('.pdf')) {
    return normalized.replace(/\.pdf$/i, '.dwg');
  }
  if (normalized.toLowerCase().endsWith('.dwg')) {
    return normalized.replace(/\.dwg$/i, '.pdf');
  }
  return null;
}

export async function deleteStorageFile(folderPath: string): Promise<void> {
  console.debug(`[deleteStorageFile] requested=${folderPath}`);
  await removeFile(folderPath);
  console.debug(`[deleteStorageFile] completed=${folderPath}`);
}

export async function moveToApproved(folderPath: string): Promise<string> {
  const approvedPath = getApprovedPath(folderPath);
  console.debug(`[moveToApproved] source=${folderPath} approved=${approvedPath}`);
  const fileBlob = await downloadFile(folderPath);
  await uploadFile(approvedPath, fileBlob, fileBlob.type || 'application/octet-stream');
  await removeFile(folderPath);
  console.info(`[moveToApproved] moved=${folderPath} -> ${approvedPath}`);
  return approvedPath;
}

async function downloadFile(folderPath: string): Promise<Blob> {
  const normalized = normalizeStoragePath(folderPath);
  console.debug(`[downloadFile] original=${folderPath} normalized=${normalized}`);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(normalized);

  if (error || !data) {
    throw new Error(`[downloadFile] Failed to download ${folderPath}: ${error?.message}`);
  }

  return data;
}

async function uploadFile(
  destinationPath: string,
  fileData: Blob | ArrayBuffer | Uint8Array,
  contentType?: string,
): Promise<void> {
  const normalized = normalizeStoragePath(destinationPath);
  console.debug(`[uploadFile] original=${destinationPath} normalized=${normalized} contentType=${contentType}`);
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(normalized, fileData, {
      upsert: true,
      contentType: contentType ?? 'application/octet-stream',
    });

  if (error) {
    throw new Error(`[uploadFile] Failed to upload ${destinationPath}: ${error.message}`);
  }
}

async function removeFile(folderPath: string): Promise<void> {
  const normalized = normalizeStoragePath(folderPath);
  console.debug(`[removeFile] original=${folderPath} normalized=${normalized}`);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([normalized]);

  if (error) {
    console.error(`[removeFile] failed to remove ${normalized}:`, error, 'responseData=', data);
    throw new Error(`[removeFile] Failed to remove ${normalized}: ${error.message}`);
  }

  // Supabase returns data=[] (empty array, no error) when the file does NOT exist.
  // This is a silent no-op — log a warning so path mismatches are traceable.
  if (!data || data.length === 0) {
    console.warn(
      `[removeFile] ⚠ No file was deleted — file may not exist or path mismatch: ${normalized}. ` +
      `This could leave stale files in storage. Verify the path is correct.`
    );
    // We do NOT throw here — treat as idempotent for resilience.
    return;
  }

  console.debug(`[removeFile] removed=${normalized} responseData=`, data);
}

/**
 * Copies the file at `folderPath` into archive/ and returns the archive path.
 * The source file is deleted only after the archive copy succeeds.
 */
export async function copyToArchive(folderPath: string): Promise<string> {
  const normalizedSource = normalizeStoragePath(folderPath);
  const archivePath = getArchivePath(normalizedSource);
  console.debug(`[copyToArchive] sourceOriginal=${folderPath} sourceNormalized=${normalizedSource} archive=${archivePath}`);

  const fileBlob = await downloadFile(normalizedSource);
  await uploadFile(archivePath, fileBlob, fileBlob.type || 'application/octet-stream');

  try {
    console.debug(`[copyToArchive] removing source after archive: ${normalizedSource}`);
    await removeFile(normalizedSource);
    console.info(`[copyToArchive] Archived old revision successfully: ${normalizedSource} -> ${archivePath}`);
  } catch (removeError: any) {
    console.error(`[copyToArchive] Failed to remove old working revision ${normalizedSource}:`, removeError);
    throw new Error(
      `[copyToArchive] Archive copy created but source removal failed for ${normalizedSource}: ${removeError.message}`,
    );
  }

  return archivePath;
}

/**
 * Copies the file at `folderPath` into approved/ and returns the approved path.
 * The source file is left in place; caller controls cleanup if required.
 */
export async function copyToApproved(folderPath: string): Promise<string> {
  const approvedPath = getApprovedPath(folderPath);
  const fileBlob = await downloadFile(folderPath);
  await uploadFile(approvedPath, fileBlob, fileBlob.type || 'application/octet-stream');
  return approvedPath;
}

/**
 * Returns a short-lived signed URL for a private Storage file.
 * Use this instead of the public URL when the bucket is NOT public.
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn = 120,
): Promise<string> {
  const normalized = normalizeStoragePath(storagePath);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(normalized, expiresIn);

  if (error) {
    console.error(`[getSignedUrl] Failed for path=${normalized}:`, error);
    throw new Error(
      `[getSignedUrl] Could not generate signed URL for ${normalized}: ${error.message}. ` +
      `File may not exist in storage or path may be mismatched.`
    );
  }

  if (!data?.signedUrl) {
    throw new Error(`[getSignedUrl] No signedUrl in response for path=${normalized}`);
  }

  return data.signedUrl;
}
