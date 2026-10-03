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
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Planting } from '../types';

interface NavbarProps {
  plantings: Planting[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  activeTab: 'dashboard' | 'schedule' | 'logs' | 'guide';
  onSelectTab: (tab: 'dashboard' | 'schedule' | 'logs' | 'guide') => void;
  onOpenNewPlanting: () => void;
  onOpenSupabaseModal: () => void;
  onOpenFertilizerCalc: () => void;
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

          {/* Plot Filter Dropdown (Active Plot) */}
          <div className="flex-1 max-w-xs sm:max-w-sm mx-2">
            <div className="relative">
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
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Supabase status button */}
            <button
              onClick={onOpenSupabaseModal}
              title="Pengaturan Supabase & SQL Schema"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isSupabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSupabaseConnected ? 'Supabase Aktif' : 'Supabase SQL'}
              </span>
              <span className="flex h-2 w-2 relative">
                {isSupabaseConnected ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                ) : null}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Tambah Tanam</span>
              <span className="sm:hidden">Tanam</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-stone-100 pt-1 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BookOpenText className="w-4 h-4" />
            <span>Buku Catatan & Biaya</span>
          </button>

          <button
            onClick={() => onSelectTab('guide')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Katalog & Panduan SOP</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
