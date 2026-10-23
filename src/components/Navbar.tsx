import React from 'react';
import { 
  Sprout, 
  Database, 
  Plus, 
  Calculator, 
  LayoutDashboard, 
  CalendarCheck2, 
  BookOpenText, 
  Layers, 
  ChevronDown,
  Bot
} from 'lucide-react';
import { Planting } from '../types';

interface NavbarProps {
  plantings: Planting[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  activeTab: 'dashboard' | 'schedule' | 'logs' | 'assistant';
  onSelectTab: (tab: 'dashboard' | 'schedule' | 'logs' | 'assistant') => void;
  onOpenNewPlanting: () => void;
  onOpenSupabaseModal: () => void;
  onOpenFertilizerCalc: () => void;
  onOpenManagePlots?: () => void;
  isSupabaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  plantings,
  selectedPlotId,
  onSelectPlot,
  activeTab,
  onSelectTab,
  onOpenNewPlanting,
  onOpenSupabaseModal,
  onOpenFertilizerCalc,
  onOpenManagePlots,
  isSupabaseConnected
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Sprout className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-stone-900">
                  Tani<span className="text-emerald-600">Guide</span>
                </span>
                <span className="hidden sm:inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Agri-Tech
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden md:block">
                Jadwal Otomatis & Catatan Digital Pertanian
              </p>
            </div>
          </div>

          {/* Plot Filter Dropdown (Active Plot) & Manage Plots Button */}
          <div className="flex-1 max-w-xs sm:max-w-md mx-2 flex items-center gap-1.5">
            <div className="relative flex-1">
              <select
                aria-label="Pilih Lahan / Plot"
                value={selectedPlotId}
                onChange={(e) => onSelectPlot(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium bg-stone-100 hover:bg-stone-200/80 text-stone-800 rounded-xl px-3 py-2 pr-8 border-0 focus:ring-2 focus:ring-emerald-500 cursor-pointer transition appearance-none truncate"
              >
                <option value="all">🌾 Semua Lahan ({plantings.length} Plot Aktif)</option>
                {plantings.map((p) => (
                  <option key={p.id} value={p.id}>
                    📍 {p.plot_name} — {p.crop_name} ({p.variety})
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {onOpenManagePlots && (
              <button
                type="button"
                onClick={onOpenManagePlots}
                title="Kelola & Hapus Lahan Pertanian"
                className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 hover:text-emerald-800 border border-stone-200 transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span className="hidden md:inline text-xs font-bold">Kelola Lahan</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Supabase status button */}
            <button
              onClick={onOpenSupabaseModal}
              title={isSupabaseConnected ? "Database Master Supabase Cloud Aktif & Terkunci — Sinkron Realtime ke Seluruh Gawai" : "Kunci Supabase Master: Simpan kunci sekali di server agar seluruh gawai otomatis terhubung"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isSupabaseConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                  : 'bg-emerald-950 text-emerald-200 border-emerald-700 hover:bg-emerald-900'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline font-bold">
                {isSupabaseConnected ? 'Supabase Master' : 'Kunci Supabase'}
              </span>
              <span className="flex h-2 w-2 relative">
                {isSupabaseConnected ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                ) : null}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-emerald-400'}`}></span>
              </span>
            </button>

            {/* Calculator button */}
            <button
              onClick={onOpenFertilizerCalc}
              title="Kalkulator Kebutuhan Pupuk"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition flex items-center gap-1.5"
            >
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Hitung Pupuk</span>
            </button>

            {/* Add New Planting Button */}
            <button
              onClick={onOpenNewPlanting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Tambah Lahan</span>
              <span className="sm:hidden">Tanam</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-stone-100 pt-1 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Ringkasan Lahan</span>
          </button>

          <button
            onClick={() => onSelectTab('schedule')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Jadwal & Checklist HST</span>
          </button>

          <button
            onClick={() => onSelectTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BookOpenText className="w-4 h-4" />
            <span>Catatan & Biaya</span>
          </button>

          <button
            onClick={() => onSelectTab('assistant')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'assistant'
                ? 'bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-sm ring-2 ring-emerald-400/40'
                : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Asisten AI Tani</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-950">
              AI
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
