import React, { useState, useEffect } from 'react';
import { 
  Key, 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Trash2,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { getStoredGeminiKey, saveStoredGeminiKey, isStaticOrGitHubPages } from '../lib/geminiKey';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const isStatic = isStaticOrGitHubPages();

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredGeminiKey());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredGeminiKey(apiKey);
    setSavedSuccess(true);
    if (onKeySaved) onKeySaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    saveStoredGeminiKey('');
    setApiKey('');
    setSavedSuccess(true);
    if (onKeySaved) onKeySaved();
    setTimeout(() => {
      setSavedSuccess(false);
    }, 1200);
  };

  const hasKey = Boolean(apiKey.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
              <Key className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>Kunci API Asisten AI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 uppercase">
                  Gemini
                </span>
              </h2>
              <p className="text-xs text-emerald-200">
                Pengaturan API Google Gemini (Khusus GitHub Pages & Mode Statis)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
          
          {/* Status Alert Banner */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-stone-700 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Status Mode Operasional AI:
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                hasKey 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {hasKey ? 'Gemini API Klien Aktif' : 'Mesin Agronomi Bawaan Aktif'}
              </span>
            </div>

            <p className="text-stone-600 leading-relaxed text-[11px]">
              {isStatic 
                ? 'Aplikasi berjalan di GitHub Pages / hosting statis. Jika Anda memasukkan API Key Gemini di bawah, AI akan memproses analisis langsung via browser. Jika dikosongkan, AI tetap aktif 100% menggunakan Mesin Pakar Agronomi Cerdas bawaan.'
                : 'Aplikasi terhubung ke backend server. Anda dapat menambahkan custom API key di sini atau membiarkannya kosong untuk menggunakan konfigurasi server otomatis.'}
            </p>
          </div>

          {/* Input API Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs sm:text-sm font-mono bg-stone-50 text-stone-900 rounded-xl px-3.5 py-2.5 pr-20 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                  title={showKey ? "Sembunyikan" : "Tampilkan"}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {hasKey && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 text-rose-500 hover:text-rose-700 transition cursor-pointer"
                    title="Hapus Kunci"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-stone-500 flex items-center justify-between pt-1">
              <span>Disimpan aman di memori lokal (localStorage) browser Anda.</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Dapatkan API Key Gratis</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Pengaturan API Key Asisten AI berhasil disimpan!</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
