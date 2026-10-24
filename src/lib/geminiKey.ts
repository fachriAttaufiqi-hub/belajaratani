/**
 * Helper untuk manajemen Kunci Google Gemini API di sisi browser (khususnya untuk hosting statis seperti GitHub Pages).
 */

const STORAGE_KEY = 'taniguide_gemini_api_key';

export function getStoredGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function saveStoredGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, key.trim());
    }
  } catch (e) {
    console.error('Gagal menyimpan Gemini API Key di localStorage:', e);
  }
}

export function hasStoredGeminiKey(): boolean {
  return Boolean(getStoredGeminiKey().trim());
}

export function isStaticOrGitHubPages(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const path = window.location.pathname;
  return host.includes('github.io') || path.includes('/docs') || (!window.location.port && host !== 'localhost');
}
