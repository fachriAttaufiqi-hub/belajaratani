import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { idbGet, idbSet, idbRemove } from './indexedDb';

const STORAGE_KEY_URL = 'taniguide_supabase_url';
const STORAGE_KEY_KEY = 'taniguide_supabase_key';

// ============================================================================
// MASUKKAN KREDENSIAL SUPABASE ANDA DI SINI
// Kunci ini akan terkunci secara permanen di seluruh gawai/browser.
// ============================================================================
export const DEFAULT_SUPABASE_URL = 'https://lactbjretztoutwerjsm.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhY3RianJldHp0b3V0d2VyanNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MDcyODIsImV4cCI6MjEwNjA4MzI4Mn0.17a2SBU4yKSxChyLIAOUwDJAYxqCM2ONTCryI8xex-o';

let inMemoryUrl = '';
let inMemoryKey = '';
let isServerLocked = false;

// Ambil konfigurasi Supabase yang terkunci
export async function syncSupabaseConfigFromAllSources(): Promise<{ isConfigured: boolean; url: string; isLocked: boolean }> {
  try {
    const res = await fetch('/api/config/supabase', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data && json.data.url && json.data.key) {
        inMemoryUrl = json.data.url.trim();
        inMemoryKey = json.data.key.trim();
        isServerLocked = true;
        try {
          localStorage.setItem(STORAGE_KEY_URL, inMemoryUrl);
          localStorage.setItem(STORAGE_KEY_KEY, inMemoryKey);
        } catch {}
        idbSet(STORAGE_KEY_URL, inMemoryUrl).catch(() => {});
        idbSet(STORAGE_KEY_KEY, inMemoryKey).catch(() => {});
        cachedClient = null;
        return { isConfigured: true, url: inMemoryUrl, isLocked: true };
      }
    }
  } catch (err) {
    // Lingkungan static / offline
  }

  await restoreSupabaseConfigFromIdb();
  checkAndApplyUrlSync();

  const current = getSavedSupabaseConfig();

  if (current.isConfigured && current.url && current.key && !isServerLocked) {
    try {
      await fetch('/api/config/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: current.url, key: current.key })
      });
      isServerLocked = true;
    } catch (e) {}
  }

  return { isConfigured: current.isConfigured, url: current.url, isLocked: isServerLocked || current.isConfigured };
}

export async function restoreSupabaseConfigFromIdb(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const savedKey = localStorage.getItem(STORAGE_KEY_KEY);
    if (!savedUrl || !savedKey) {
      const idbUrl = await idbGet<string>(STORAGE_KEY_URL);
      const idbKey = await idbGet<string>(STORAGE_KEY_KEY);
      if (idbUrl && idbKey) {
        localStorage.setItem(STORAGE_KEY_URL, idbUrl);
        localStorage.setItem(STORAGE_KEY_KEY, idbKey);
        inMemoryUrl = idbUrl;
        inMemoryKey = idbKey;
        cachedClient = null;
        return true;
      }
    } else {
      inMemoryUrl = savedUrl;
      inMemoryKey = savedKey;
      return true;
    }
  } catch (e) {
    console.warn('Gagal memulihkan config Supabase dari IndexedDB:', e);
  }
  return false;
}

export function getSavedSupabaseConfig() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY || '';

  const savedUrl = (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null) || inMemoryUrl || envUrl;
  const savedKey = (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null) || inMemoryKey || envKey;

  return {
    url: savedUrl ? savedUrl.trim() : '',
    key: savedKey ? savedKey.trim() : '',
    isConfigured: Boolean(savedUrl && savedKey),
    isLocked: isServerLocked || Boolean(savedUrl && savedKey)
  };
}

export async function saveSupabaseConfig(url: string, key: string, lockToServer = true): Promise<boolean> {
  const cleanUrl = url ? url.trim() : '';
  const cleanKey = key ? key.trim() : '';

  inMemoryUrl = cleanUrl;
  inMemoryKey = cleanKey;
  cachedClient = null;
  lastUrl = '';
  lastKey = '';

  if (cleanUrl && cleanKey) {
    try {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
      localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    } catch {}
    idbSet(STORAGE_KEY_URL, cleanUrl).catch(() => {});
    idbSet(STORAGE_KEY_KEY, cleanKey).catch(() => {});
    isServerLocked = true;

    if (lockToServer) {
      try {
        await fetch('/api/config/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: cleanUrl, key: cleanKey })
        });
      } catch (e) {
        console.warn('Gagal mengunci config ke server backend:', e);
      }
    }
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_KEY);
    } catch {}
    idbRemove(STORAGE_KEY_URL).catch(() => {});
    idbRemove(STORAGE_KEY_KEY).catch(() => {});
    isServerLocked = false;
  }
  return true;
}

export function checkAndApplyUrlSync(): { applied: boolean; message?: string } {
  if (typeof window === 'undefined') return { applied: false };
  try {
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    let payload = '';
    if (hash.includes('sync=')) {
      const match = hash.match(/sync=([^&]+)/);
      if (match) payload = match[1];
    } else if (search.includes('sync=')) {
      const match = search.match(/sync=([^&]+)/);
      if (match) payload = match[1];
    }

    if (payload) {
      const decoded = decodeURIComponent(atob(payload));
      const [syncUrl, syncKey] = decoded.split('|');
      if (syncUrl && syncKey) {
        saveSupabaseConfig(syncUrl.trim(), syncKey.trim(), true);
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
        return { 
          applied: true, 
          message: 'Koneksi Cloud Supabase otomatis dikunci ke gawai ini!' 
        };
      }
    }
  } catch (err) {
    console.warn('Gagal membaca payload sinkronisasi URL:', err);
  }
  return { applied: false };
}

export function generateSyncShareUrl(): string {
  const { url, key, isConfigured } = getSavedSupabaseConfig();
  if (!isConfigured) return '';
  try {
    const payload = btoa(encodeURIComponent(`${url.trim()}|${key.trim()}`));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#sync=${payload}`;
  } catch {
    return '';
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSavedSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (error) {
    console.error('Gagal inisialisasi Supabase client:', error);
    return null;
  }
}

// --- Realtime Synchronization Subscriptions ---
let activeRealtimeChannel: any = null;
let localBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBroadcastChannel = new BroadcastChannel('taniguide_realtime_local');
  } catch {}
}

export function subscribeToSupabaseRealtime(
  onDataChanged: (table: string, eventType: string, newRecord?: any, oldRecord?: any) => void
): () => void {
  const client = getSupabaseClient();

  if (localBroadcastChannel) {
    localBroadcastChannel.onmessage = (ev) => {
      if (ev.data && ev.data.table) {
        onDataChanged(ev.data.table, ev.data.eventType || 'UPDATE', ev.data.data);
      }
    };
  }

  if (!client) {
    return () => {
      if (localBroadcastChannel) localBroadcastChannel.onmessage = null;
    };
  }

  if (activeRealtimeChannel) {
    try {
      activeRealtimeChannel.unsubscribe();
    } catch {}
    activeRealtimeChannel = null;
  }

  try {
    const channel = client.channel('taniguide-master-realtime');

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plantings' }, (payload: any) => {
        onDataChanged('plantings', payload.eventType, payload.new, payload.old);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload: any) => {
        onDataChanged('tasks', payload.eventType, payload.new, payload.old);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, (payload: any) => {
        onDataChanged('activity_logs', payload.eventType, payload.new, payload.old);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload: any) => {
        onDataChanged('expenses', payload.eventType, payload.new, payload.old);
      })
      .on('broadcast', { event: 'data_changed' }, ({ payload }: any) => {
        if (payload && payload.table) {
          onDataChanged(payload.table, payload.eventType || 'UPDATE', payload.data);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ [TaniGuide Realtime] Berhasil terhubung ke Supabase Realtime channel!');
        }
      });

    activeRealtimeChannel = channel;

    return () => {
      if (localBroadcastChannel) localBroadcastChannel.onmessage = null;
      try {
        channel.unsubscribe();
      } catch {}
    };
  } catch (err) {
    console.warn('Gagal mengaktifkan Realtime subscription:', err);
    return () => {
      if (localBroadcastChannel) localBroadcastChannel.onmessage = null;
    };
  }
}

export function broadcastRealtimeChange(table: string, eventType: 'INSERT' | 'UPDATE' | 'DELETE', data: any) {
  if (localBroadcastChannel) {
    try {
      localBroadcastChannel.postMessage({ table, eventType, data });
    } catch {}
  }

  if (activeRealtimeChannel) {
    try {
      activeRealtimeChannel.send({
        type: 'broadcast',
        event: 'data_changed',
        payload: { table, eventType, data }
      });
    } catch (e) {
      console.warn('Gagal broadcast perubahan data:', e);
    }
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url, key);
    const { error } = await testClient.from('crops').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Terhubung ke Supabase! Namun tabel belum dibuat. Silakan jalankan DDL SQL.'
        };
      }
      return { success: false, message: `Error Supabase (${error.code}): ${error.message}` };
    }

    // CATATAN: Bagian auto-seed `upsert(cropsPayload)` sengaja DIBUANG 
    // agar data template bawaan tidak secara otomatis terisi ulang ketika Anda menghapusnya.

    return { success: true, message: 'Koneksi ke Supabase Berhasil!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal terhubung ke host Supabase' };
  }
}
