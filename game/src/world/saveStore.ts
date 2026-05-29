/**
 * IndexedDB I/O for the save game. Browser-only (no Node test path —
 * the testable logic lives in saveGame.ts). One DB, one store, one key.
 */

import { deserialize, serialize, type SaveData } from './saveGame';

const DB_NAME = 'dino-park';
const STORE = 'state';
const KEY = 'current';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveToDb(data: SaveData): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(serialize(data), KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadFromDb(): Promise<SaveData | null> {
  const db = await openDb();
  try {
    const raw = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return typeof raw === 'string' ? deserialize(raw) : null;
  } finally {
    db.close();
  }
}
