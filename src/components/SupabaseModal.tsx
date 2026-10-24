import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Copy, 
  Check, 
  Download, 
  Key, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ShieldCheck, 
  Code2, 
  RefreshCw, 
  Trash2,
  Smartphone,
  Share2,
  Lock,
  Radio,
  FileJson,
  UploadCloud,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { SUPABASE_SQL_DDL } from '../lib/sqlSchema';
import { getSavedSupabaseConfig, saveSupabaseConfig, testSupabaseConnection, generateSyncShareUrl } from '../lib/supabase';
import { FarmDB } from '../lib/storage';
import { getStoredGeminiKey, saveStoredGeminiKey, isStaticOrGitHubPages } from '../lib/geminiKey';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConnectionChanged
}) => {
  const currentConfig = getSavedSupabaseConfig();
  const [url, setUrl] = useState<string>(currentConfig.url);
  const [key, setKey] = useState<string>(currentConfig.key);
  const [activeTab, setActiveTab] = useState<'config' | 'api_ai' | 'sync_device' | 'sql' | 'architecture'>('config');
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>(() => getStoredGeminiKey());
  const [geminiKeySaved, setGeminiKeySaved] = useState<boolean>(false);

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredGeminiKey(geminiKeyInput);
    setGeminiKeySaved(true);
    setTimeout(() => setGeminiKeySaved(false), 2500);
  };

  // Sync state
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [clearing, setClearing] = useState<boolean>(false);

  const handleClearData = async () => {
    if (window.confirm('PERINGATAN: Kosongkan semua data lahan, jadwal, catatan, dan biaya di Supabase & server?')) {
      setClearing(true);
      const res = await FarmDB.clearAllData();
      setClearing(false);
      onConnectionChanged();
      setTestResult({
        success: res.success,
        message: res.success ? 'Seluruh database telah dikosongkan secara total (0 data).' : `Gagal: ${res.error}`
      });
    }
  };

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      saveSupabaseConfig('', '');
      onConnectionChanged();
      setTestResult({ success: false, message: 'Kredensial Supabase telah dibersihkan.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url.trim(), key.trim());
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      await saveSupabaseConfig(url.trim(), key.trim(), true);
      onConnectionChanged();
    }
  };

  const handleBatchSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await FarmDB.syncAllLocalToSupabase();
      setSyncResult(res);
      if (res.success) {
        onConnectionChanged();
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err?.message || 'Gagal sinkronisasi data' });
    } finally {
      setSyncing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_DDL], { type: 'text/sql' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'taniguide_supabase_ddl.sql';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleCopySyncLink = () => {
    const syncUrl = generateSyncShareUrl();
    if (!syncUrl) {
      alert('Kunci Supabase URL & Anon Key terlebih dahulu di tab "Kunci Supabase Master"!');
      return;
    }
    navigator.clipboard.writeText(syncUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleExportJson = async () => {
    const json = await FarmDB.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `taniguide_cadangan_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await FarmDB.importAllData(content);
        setImportResult(res);
        if (res.success) {
          onConnectionChanged();
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-stone-900 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl border border-emerald-400/30">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold">Master Database Supabase Cloud</h2>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Server Locked
                </span>
              </div>
              <p className="text-xs text-emerald-200/90">
                Satu Master Database untuk Semua Gawai — Sinkron Realtime Tanpa Perlu Masukkan Kunci Lagi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 sm:px-6 gap-2 sm:gap-3 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Kunci Supabase Master</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">Utama</span>
          </button>

          <button
            onClick={() => setActiveTab('api_ai')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'api_ai'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Kunci API Asisten AI</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">GitHub Pages</span>
          </button>

          <button
            onClick={() => setActiveTab('sync_device')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'sync_device'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Buka di HP / Tablet</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Skrip DDL SQL & Realtime</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Skema Database Master</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">

          {/* TAB 1: KUNCI SUPABASE MASTER */}
          {activeTab === 'config' && (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              {/* Status Box */}
              {currentConfig.isConfigured ? (
                <div className="p-4 sm:p-5 rounded-2xl border bg-emerald-50 border-emerald-300 text-emerald-950 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span className="font-extrabold text-sm sm:text-base">Supabase Terkunci Sebagai Master di Server</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-200 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Terkunci Permanen
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Kredensial database Supabase telah dikunci di server backend. Saat Anda membuka TaniGuide dari HP, laptop, atau tablet lain, gawai tersebut <strong>langsung terhubung secara otomatis tanpa perlu memasukkan URL atau Kunci lagi!</strong>
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 pt-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <span>Sinkronisasi Realtime Multi-Perangkat Aktif</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-2xl border bg-linear-to-r from-stone-900 to-emerald-950 border-emerald-700/50 text-white space-y-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-400" />
                    <span className="font-extrabold text-sm sm:text-base">Kunci Supabase Master untuk Seluruh Gawai</span>
                  </div>
                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    Masukkan URL dan Anon Key proyek Supabase Anda sekali saja di bawah. Aplikasi akan <strong>menguncinya ke server</strong> sehingga saat Anda berganti ke HP, tablet, atau laptop lain, datanya langsung sama dan realtime tanpa perlu memasukkan kuncinya lagi.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-id.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold rounded-xl border border-stone-300 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-stone-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  Supabase Anon (Public) Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold rounded-xl border border-stone-300 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono bg-stone-50/50"
                  required
                />
              </div>

              {testResult && (
                <div className={`p-4 rounded-2xl text-xs font-medium border flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">{testResult.success ? 'Koneksi Berhasil & Terkunci' : 'Koneksi Gagal'}:</span>
                    <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200 flex-wrap">
                <button
                  type="button"
                  onClick={handleClearData}
                  disabled={clearing}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Kosongkan seluruh data Supabase"
                >
                  {clearing ? <RefreshCw className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4 text-rose-600" />}
                  <span>{clearing ? 'Mengosongkan...' : 'Kosongkan Seluruh Data'}</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleBatchSync}
                    disabled={syncing || !currentConfig.isConfigured}
                    className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Kirim semua data saat ini ke Supabase agar menjadi master"
                  >
                    {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 text-teal-600" />}
                    <span>{syncing ? 'Mengunggah...' : 'Jadikan Data Master di Supabase'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={testing}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>{testing ? 'Menguji & Mengunci...' : 'Kunci Supabase untuk Semua Gawai'}</span>
                  </button>
                </div>
              </div>

              {syncResult && (
                <div className={`p-4 rounded-2xl text-xs font-medium border flex items-start gap-2.5 mt-2 ${
                  syncResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {syncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">{syncResult.success ? 'Sinkronisasi Master Berhasil' : 'Sinkronisasi Gagal'}:</span>
                    <p className="mt-0.5">{syncResult.message}</p>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB: KUNCI API ASISTEN AI (GEMINI) */}
          {activeTab === 'api_ai' && (
            <form onSubmit={handleSaveGeminiKey} className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl border bg-linear-to-r from-emerald-950 to-teal-950 border-emerald-700/50 text-white space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                    <span className="font-extrabold text-sm sm:text-base">Pengaturan Kunci API Asisten AI</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    geminiKeyInput.trim()
                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                      : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                  }`}>
                    {geminiKeyInput.trim() ? 'Kunci Klien Tersimpan' : 'Mode Agronomi Bawaan'}
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  <strong>Khusus GitHub Pages (Hosting Statis):</strong> Karena GitHub Pages berjalan tanpa server Node.js di latar belakang, masukkan API Key Google Gemini gratis Anda di bawah agar Asisten AI dapat berpikir secara live. Jika dikosongkan, Asisten AI tetap 100% aktif menggunakan <strong>Mesin Pakar Agronomi Cerdas bawaan</strong> secara offline.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-600" />
                    Google Gemini API Key
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>Dapatkan API Key Gratis</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  className="w-full text-xs sm:text-sm font-mono rounded-xl border border-stone-300 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-stone-50/50"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Kunci API ini disimpan secara aman dan lokal hanya di browser (localStorage) perangkat Anda.
                </p>
              </div>

              {geminiKeySaved && (
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Kunci API Asisten AI berhasil diperbarui!</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                {geminiKeyInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeminiKeyInput('');
                      saveStoredGeminiKey('');
                      setGeminiKeySaved(true);
                      setTimeout(() => setGeminiKeySaved(false), 2000);
                    }}
                    className="px-3.5 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Kunci</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="ml-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Kunci API AI</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: BUKA DI HP / TABLET (INSTANT QR & LINK) */}
          {activeTab === 'sync_device' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-sm sm:text-base">
                  <Smartphone className="w-5 h-5 text-emerald-700" />
                  <span>Buka Langsung di HP atau Tablet (Tanpa Perlu Ketik Kunci)</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Karena Supabase sudah dikunci di server, Anda cukup membuka link website ini di HP atau memindai QR Code berikut. Seluruh data lahan, jadwal, dan catatan akan otomatis sama dan sinkron secara realtime!
                </p>

                {currentConfig.isConfigured ? (
                  <div className="pt-2 space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={handleCopySyncLink}
                        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{linkCopied ? 'Tautan Berhasil Disalin! Kirim via WA' : 'Salin Tautan Langsung ke HP'}</span>
                      </button>
                      <span className="text-[11px] text-stone-500 text-center sm:text-left">
                        Kirim ke WhatsApp/Telegram untuk dibuka di smartphone Anda.
                      </span>
                    </div>

                    {/* QR Code Scanner for Mobile */}
                    <div className="p-4 rounded-xl bg-white border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
                      <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=${encodeURIComponent(generateSyncShareUrl() || window.location.href)}`}
                          alt="QR Code Buka di HP"
                          className="w-28 h-28 object-contain"
                        />
                      </div>
                      <div className="space-y-1.5 text-center sm:text-left">
                        <h5 className="font-extrabold text-xs sm:text-sm text-stone-900 flex items-center justify-center sm:justify-start gap-1.5">
                          <Smartphone className="w-4 h-4 text-emerald-600" />
                          <span>Pindai Kamera Smartphone Anda</span>
                        </h5>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          Arahkan kamera smartphone ke QR Code di samping untuk membuka TaniGuide di HP. Data master langsung tersambung dan realtime seketika.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <button
                      onClick={() => setActiveTab('config')}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Key className="w-4 h-4" />
                      <span>Kunci Supabase Terlebih Dahulu di Tab "Kunci Supabase Master"</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Cadangan File JSON */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm sm:text-base">
                  <FileJson className="w-4 h-4 text-blue-600" />
                  <span>Cadangan File Lokal (.json)</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Anda juga dapat mengunduh atau memulihkan file cadangan JSON secara langsung kapan saja.
                </p>

                <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExportJson}
                    className="p-3.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Unduh File Cadangan (.json)</span>
                  </button>

                  <label className="p-3.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    <span>Impor File Cadangan</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {importResult && (
                  <div className={`p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                    importResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    {importResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{importResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SQL SCRIPT VIEWER */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    DDL SQL & Realtime Publication untuk Supabase
                  </h4>
                  <p className="text-xs text-emerald-900/80 mt-0.5">
                    Mencakup 5 tabel utama, Foreign Keys, indeks performa, pemicu timestamp, RLS, dan replikasi Realtime.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Seluruh SQL'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSql}
                    className="p-2 rounded-xl border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition cursor-pointer"
                    title="Unduh File .sql"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Code viewer box */}
              <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-900 text-emerald-300 font-mono text-xs shadow-inner">
                <div className="bg-stone-950 px-4 py-2.5 flex items-center justify-between border-b border-stone-800 text-stone-400">
                  <span className="text-[11px] font-bold">taniguide_supabase_ddl.sql</span>
                  <span className="text-[10px] text-stone-500">PostgreSQL 15+ & Realtime Publication</span>
                </div>
                <pre className="p-4 overflow-x-auto max-h-[380px] leading-relaxed text-stone-200">
                  <code>{SUPABASE_SQL_DDL}</code>
                </pre>
              </div>

              {/* Step-by-step instructions */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs text-stone-700 space-y-2">
                <h5 className="font-bold text-stone-900">Cara Menjalankan Skrip di Supabase:</h5>
                <ol className="list-decimal list-inside space-y-1 text-stone-600">
                  <li>Buka proyek Anda di <strong>supabase.com</strong>.</li>
                  <li>Buka tab <strong>SQL Editor</strong> di menu sebelah kiri.</li>
                  <li>Klik <strong>New Query</strong>, tempel (paste) skrip SQL di atas, lalu klik <strong>Run</strong>.</li>
                  <li>Semua tabel beserta replikasi Realtime otomatis aktif seketika.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE EXPLANATION */}
          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <h4 className="font-bold text-base text-emerald-950">Arsitektur Master Database Supabase Realtime</h4>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Aplikasi TaniGuide menggunakan Supabase PostgreSQL sebagai <strong>Single Source of Truth (Master Database Tunggal)</strong>. Setiap penambahan lahan, checklist jadwal, catatan lapangan, atau pengeluaran langsung tersimpan di cloud dan di-broadcast secara realtime ke seluruh gawai yang Anda buka.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-1.5 shadow-2xs">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    🌾 Tabel <code>public.crops</code>
                  </span>
                  <p className="text-xs text-stone-600">
                    Master template komoditas (Padi, Jagung, Cabai, Bawang Merah, dll.), rentang hari panen, dan pedoman dosis pupuk per hektar.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-1.5 shadow-2xs">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    📍 Tabel <code>public.plantings</code>
                  </span>
                  <p className="text-xs text-stone-600">
                    Data lahan budidaya aktif dengan varietas benih, luas lahan (m²), tanggal tanam (0 HST), dan target estimasi panen.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-1.5 shadow-2xs">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    ✅ Tabel <code>public.tasks</code>
                  </span>
                  <p className="text-xs text-stone-600">
                    Daftar checklist kegiatan bertani otomatis berbasis HST (Hari Setelah Tanam), takaran pupuk spesifik, dan status penyelesaian.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-1.5 shadow-2xs">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    📝 Tabel <code>public.activity_logs</code>
                  </span>
                  <p className="text-xs text-stone-600">
                    Catatan digital lapangan harian, pengamatan tinggi tanaman, cuaca lokal, dan pemantauan serangan hama/penyakit.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-1.5 shadow-2xs col-span-1 sm:col-span-2">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    💰 Tabel <code>public.expenses</code>
                  </span>
                  <p className="text-xs text-stone-600">
                    Arus kas dan pengeluaran modal produksi (benih, pupuk, pestisida, upah buruh tani) dengan kalkulasi biaya per meter persegi.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>TaniGuide Cloud Master Architecture</span>
          <button
            onClick={onClose}
            className="font-bold text-stone-700 hover:text-stone-900 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
