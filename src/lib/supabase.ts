import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_CROPS } from '../data/defaultCrops';

const STORAGE_KEY_URL = 'taniguide_supabase_url';
const STORAGE_KEY_KEY = 'taniguide_supabase_key';

// Anda dapat mengisi kredensial Supabase di sini agar langsung aktif otomatis di GitHub Pages:
export const DEFAULT_SUPABASE_URL = '';
export const DEFAULT_SUPABASE_ANON_KEY = '';

export function getSavedSupabaseConfig() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY || '';

  const savedUrl = localStorage.getItem(STORAGE_KEY_URL) || envUrl;
  const savedKey = localStorage.getItem(STORAGE_KEY_KEY) || envKey;

  return {
    url: savedUrl,
    key: savedKey,
    isConfigured: Boolean(savedUrl && savedKey)
  };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url && key) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    cachedClient = null;
    lastUrl = '';
    lastKey = '';
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
    lastUrl = '';
    lastKey = '';
  }
}

// Periksa apakah ada parameter sinkronisasi di URL (misal dibuka dari tautan gawai lain)
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
        saveSupabaseConfig(syncUrl.trim(), syncKey.trim());
        // Bersihkan parameter sync dari URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
        return { applied: true, message: 'Koneksi Supabase otomatis berhasil disinkronkan dari gawai sebelumnya!' };
      }
    }
  } catch (err) {
    console.warn('Gagal membaca payload sinkronisasi URL:', err);
  }
  return { applied: false };
}

// Buat tautan berbagi konfigurasi Supabase untuk gawai lain
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

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url, key);
    // Cek query sederhana ke tabel crops atau auth
    const { error } = await testClient.from('crops').select('id').limit(1);
    if (error) {
      // Jika tabel belum dibuat, periksa kode error
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Terhubung ke Supabase! Namun tabel belum dibuat. Silakan salin & jalankan Skrip DDL SQL di tab SQL Editor Supabase.'
        };
      }
      return { success: false, message: `Error Supabase (${error.code}): ${error.message}` };
    }
    // Auto-seed katalog komoditas ke Supabase agar foreign key tidak pernah error
    try {
      const cropsPayload = DEFAULT_CROPS.map(c => ({
        id: c.id,
        name: c.name,
        latin_name: c.latinName,
        category: c.category,
        variety_examples: c.varietyExamples,
        harvest_days_min: c.harvestDaysMin,
        harvest_days_max: c.harvestDaysMax,
        icon: c.icon,
        description: c.description
      }));
      await testClient.from('crops').upsert(cropsPayload, { onConflict: 'id' });
    } catch {
      // ignore
    }

    return { success: true, message: 'Koneksi ke Supabase Berhasil! Katalog komoditas & database siap digunakan.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal terhubung ke host Supabase' };
  }
}
