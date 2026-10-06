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
  ExternalLink, 
  Code2, 
  RefreshCw, 
  Trash2,
  Smartphone,
  Share2,
  UploadCloud,
  FileJson,
  Link
} from 'lucide-react';
import { SUPABASE_SQL_DDL } from '../lib/sqlSchema';
import { getSavedSupabaseConfig, saveSupabaseConfig, testSupabaseConnection, generateSyncShareUrl } from '../lib/supabase';
import { FarmDB } from '../lib/storage';

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
  const [activeTab, setActiveTab] = useState<'sync_device' | 'config' | 'sql' | 'architecture'>('sync_device');
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [clearing, setClearing] = useState<boolean>(false);

  const handleClearData = async () => {
    if (window.confirm('PERINGATAN: Kosongkan semua data lahan, jadwal, catatan, dan biaya di perangkat ini dan di Supabase?')) {
      setClearing(true);
      const res = await FarmDB.clearAllData();
      setClearing(false);
      onConnectionChanged();
      setTestResult({
        success: res.success,
        message: res.success ? 'Tampilan & database telah dikosongkan secara total (0 data).' : `Gagal: ${res.error}`
      });
    }
  };

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      saveSupabaseConfig('', '');
      onConnectionChanged();
      setTestResult({ success: false, message: 'Konfigurasi dikosongkan. Aplikasi berjalan dalam mode Offline Local Storage.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url.trim(), key.trim());
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseConfig(url.trim(), key.trim());
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
      alert('Konfigurasikan Supabase URL & Anon Key terlebih dahulu di tab "Pengaturan Koneksi API"!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-800 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold">Integrasi Supabase & DDL SQL</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  PostgreSQL + RLS
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Skrip skema database, aturan keamanan baris (RLS), dan konektor cloud
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
            onClick={() => setActiveTab('sync_device')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'sync_device'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Sinkron Antar-Gawai</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">Solusi</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Koneksi Supabase Cloud</span>
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
            <span>Skrip DDL SQL</span>
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
            <span>Skema Tabel</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">

          {/* TAB: SINKRONISASI ANTAR GAWAI & CADANGAN */}
          {activeTab === 'sync_device' && (
            <div className="space-y-5">
              
              {/* Status Banner */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 ${
                currentConfig.isConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                {currentConfig.isConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">
                    {currentConfig.isConfigured 
                      ? 'Database Supabase Cloud Aktif di Gawai Ini!' 
                      : 'Mengapa Aplikasi Kosong Saat Pindah Gawai?'}
                  </h4>
                  <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-90">
                    {currentConfig.isConfigured 
                      ? 'Koneksi Supabase sudah terhubung di browser gawai ini. Agar HP/laptop kedua Anda juga menampilkan data yang sama, salin tautan sinkronisasi di bawah dan buka di gawai tersebut!' 
                      : 'Data Anda saat ini hanya tersimpan di memori browser (LocalStorage) gawai pertama ini. Karena belum terhubung ke database online Supabase, gawai lain Anda tidak bisa membaca data tersebut secara otomatis.'}
                  </p>
                </div>
              </div>

              {/* CARD 1: Link Sinkronisasi 1-Klik */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm sm:text-base">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span>Solusi 1: Tautan Sinkronisasi Gawai 1-Klik (Paling Praktis)</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Cukup salin tautan di bawah ini dan kirimkan (misal via WhatsApp) ke HP/laptop kedua Anda. Saat tautan diketuk di gawai kedua, database Supabase akan langsung terkonfigurasi otomatis tanpa perlu mengetik ulang kredensial apa pun!
                </p>

                {currentConfig.isConfigured ? (
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={handleCopySyncLink}
                      className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{linkCopied ? 'Tautan Berhasil Disalin! Siap Dikirim ke Gawai Lain' : 'Salin Tautan Sinkronisasi Gawai'}</span>
                    </button>
                    <span className="text-[11px] text-stone-500 text-center sm:text-left">
                      Buka tautan ini di gawai lain agar langsung terhubung.
                    </span>
                  </div>
                ) : (
                  <div className="pt-1">
                    <button
                      onClick={() => setActiveTab('config')}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Key className="w-4 h-4" />
                      <span>Hubungkan Supabase Dulu di Tab "Koneksi Supabase Cloud"</span>
                    </button>
                  </div>
                )}
              </div>

              {/* CARD 2: Cadangkan & Pindahkan Manual (JSON) */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm sm:text-base">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <span>Solusi 2: Ekspor & Impor File Cadangan (Bisa Langsung Tanpa Supabase)</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Jika Anda belum sempat menyiapkan akun Supabase online, Anda bisa langsung memindahkan seluruh data lahan, jadwal, dan catatan ke gawai lain: unduh file cadangan dari gawai ini, lalu impor di gawai lain.
                </p>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExportJson}
                    className="p-3.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Unduh Cadangan Data (.json)</span>
                  </button>

                  <label className="p-3.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    <span>Pulihkan / Impor File Cadangan</span>
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
          
          {/* TAB 1: SQL SCRIPT VIEWER */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    DDL SQL Siap Eksekusi di Supabase SQL Editor
                  </h4>
                  <p className="text-xs text-emerald-900/80 mt-0.5">
                    Mencakup 5 tabel utama, Foreign Keys, indeks performa, pemicu timestamp, dan RLS.
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
                  <span className="text-[10px] text-stone-500">PostgreSQL 15+</span>
                </div>
                <pre className="p-4 overflow-x-auto max-h-[380px] leading-relaxed text-stone-200">
                  <code>{SUPABASE_SQL_DDL}</code>
                </pre>
              </div>

              {/* Step-by-step instructions */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs text-stone-700 space-y-2">
                <h5 className="font-bold text-stone-900">Cara Menggunakan di Supabase:</h5>
                <ol className="list-decimal list-inside space-y-1 text-stone-600">
                  <li>Buka dashboard proyek Anda di <strong>supabase.com</strong>.</li>
                  <li>Klik menu <strong>SQL Editor</strong> di bilah navigasi kiri.</li>
                  <li>Klik <strong>New Query</strong>, lalu paste skrip SQL di atas.</li>
                  <li>Tekan tombol hijau <strong>Run</strong> untuk membuat tabel, indeks, dan RLS secara otomatis.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: ARCHITECTURE EXPLANATION */}
          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <h4 className="font-bold text-base text-stone-900">Ringkasan Arsitektur TaniGuide</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Aplikasi dibangun dengan arsitektur <strong>Offline-First & Cloud-Synced</strong>. Data tersimpan di Supabase PostgreSQL dengan pengamanan Row Level Security (RLS) terpisah per pengguna.
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

          {/* TAB 3: CONNECTION CONFIG */}
          {activeTab === 'config' && (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Koneksi Opsional (Bisa Menggunakan Mode Lokal)
                </span>
                <p>
                  Jika Anda belum menyiapkan Supabase, aplikasi tetap dapat digunakan secara penuh menggunakan penyimpanan lokal (LocalStorage). Saat Anda memasukkan URL & Anon Key di bawah, data akan langsung tersinkronisasi ke cloud.
                </p>
              </div>

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
                  className="w-full text-xs sm:text-sm font-semibold rounded-xl border border-stone-200 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
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
                  className="w-full text-xs sm:text-sm font-semibold rounded-xl border border-stone-200 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              {testResult && (
                <div className={`p-4 rounded-2xl text-xs font-medium border flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">{testResult.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}:</span>
                    <p className="mt-0.5">{testResult.message}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 flex-wrap">
                <button
                  type="button"
                  onClick={handleClearData}
                  disabled={clearing}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Kosongkan seluruh data lokal & Supabase"
                >
                  {clearing ? <RefreshCw className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4 text-rose-600" />}
                  <span>{clearing ? 'Mengosongkan...' : 'Kosongkan Semua Data'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBatchSync}
                    disabled={syncing || !currentConfig.isConfigured}
                    className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Kirim semua data plot, tugas, dan catatan lokal ke Supabase"
                  >
                    {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 text-teal-600" />}
                    <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan ke Cloud'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={testing}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{testing ? 'Menguji...' : 'Uji & Simpan Koneksi'}</span>
                  </button>
                </div>
              </div>

              {syncResult && (
                <div className={`p-4 rounded-2xl text-xs font-medium border flex items-start gap-2.5 mt-2 ${
                  syncResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {syncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">{syncResult.success ? 'Sinkronisasi Berhasil' : 'Sinkronisasi Gagal'}:</span>
                    <p className="mt-0.5">{syncResult.message}</p>
                  </div>
                </div>
              )}
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>TaniGuide Enterprise Architecture</span>
          <button
            onClick={onClose}
            className="font-bold text-stone-700 hover:text-stone-900"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
