import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_CROPS } from '../data/defaultCrops';

const STORAGE_KEY_URL = 'taniguide_supabase_url';
const STORAGE_KEY_KEY = 'taniguide_supabase_key';

export function getSavedSupabaseConfig() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

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
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
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
