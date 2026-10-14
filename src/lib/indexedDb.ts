// IndexedDB persistence layer for TaniGuide
// Survives standard Chrome clearings and serves as secondary offline cache

const DB_NAME = 'taniguide_local_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB open error:', request.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB exception:', err);
      resolve(null);
    }
  });
}

export async function idbSet(key: string, value: any): Promise<boolean> {
  try {
    const db = await openDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        console.warn('idbSet error:', req.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('idbSet error:', err);
    return false;
  }
}

export async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    if (!db) return null;

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result !== undefined ? req.result : null);
      };
      req.onerror = () => {
        console.warn('idbGet error:', req.error);
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('idbGet error:', err);
    return null;
  }
}

export async function idbRemove(key: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Request persistent storage from browser (prevents Chrome eviction)
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return true;
    } catch (e) {
      console.warn('Storage persistence request error:', e);
    }
  }
  return false;
}
