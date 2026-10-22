import React, { useState } from 'react';
import { 
  Sprout, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Sun, 
  CloudRain, 
  Droplets, 
  ChevronRight, 
  Sparkles,
  MapPin,
  Check,
  Plus,
  RotateCcw,
  Trash2,
  X,
  Layers,
  Bot
} from 'lucide-react';
import { Planting, TaskItem } from '../types';
import { calculateHST, formatDate } from '../lib/storage';
import { DEFAULT_CROPS } from '../data/defaultCrops';
import { formatPlantingScale, summarizePlantingsScale } from '../lib/scaleUnits';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  plantings: Planting[];
  tasks: TaskItem[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  onToggleTask: (taskId: string, isCompleted: boolean) => void;
  onNavigateToSchedule: () => void;
  onNavigateToAssistant?: () => void;
  onOpenNewPlanting: () => void;
  onDeletePlanting: (plotId: string) => void;
  onOpenManagePlots?: () => void;
  onRestoreMasterData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  plantings,
  tasks,
  selectedPlotId,
  onSelectPlot,
  onToggleTask,
  onNavigateToSchedule,
  onNavigateToAssistant,
  onOpenNewPlanting,
  onDeletePlanting,
  onOpenManagePlots,
  onRestoreMasterData
}) => {
  const todayStr = formatDate(new Date());
  const [plantingToDelete, setPlantingToDelete] = useState<Planting | null>(null);

  // Filter tasks based on selected plot
  const activeTasks = selectedPlotId === 'all' 
    ? tasks 
    : tasks.filter(t => t.planting_id === selectedPlotId);

  // Filter plantings
  const activePlantings = selectedPlotId === 'all'
    ? plantings
    : plantings.filter(p => p.id === selectedPlotId);

  // Stats calculation
  const totalAreaSqm = plantings.reduce((acc, p) => acc + (Number(p.area_sqm) || 0), 0);
  const totalAreaHa = (totalAreaSqm / 10000).toFixed(2);
  const scaleSummary = summarizePlantingsScale(plantings);

  // Today's tasks (due today or overdue and not completed)
  const todayTasks = activeTasks.filter(t => t.due_date <= todayStr && !t.is_completed);
  const completedTodayTasks = activeTasks.filter(t => t.due_date <= todayStr && t.is_completed);

  // Next upcoming harvest
  const upcomingHarvests = [...plantings]
    .map(p => {
      const hst = calculateHST(p.planting_date);
      const crop = DEFAULT_CROPS.find(c => c.id === p.crop_id);
      const targetHst = crop ? crop.harvestDaysMax : 100;
      const daysLeft = Math.max(0, targetHst - hst);
      return { ...p, currentHst: hst, daysLeft, targetHst };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const nearestHarvest = upcomingHarvests[0];

  const handleCheckboxClick = (taskId: string, currentStatus: boolean) => {
    onToggleTask(taskId, !currentStatus);
    if (!currentStatus) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#059669', '#34d399', '#f59e0b']
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Greeting */}
      <div className="bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Manajemen Budidaya Pertanian Modern</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Bertani, Rekan Petani Mandiri! 🌱
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base max-w-2xl leading-relaxed">
              Pantau umur tanaman (HST), ikuti timeline otomatis pemupukan & penyiangan, serta pastikan tidak ada agenda perawatan lahan yang terlewat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigateToAssistant && (
              <button
                type="button"
                onClick={onNavigateToAssistant}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 shadow-md backdrop-blur-xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-emerald-300" />
                <span>Konsultasi AI</span>
              </button>
            )}

            <button
              onClick={onOpenNewPlanting}
              className="px-5 py-3 rounded-2xl bg-white text-emerald-800 font-bold text-sm shadow-lg hover:bg-emerald-50 transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Lahan Baru
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Plot */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Lahan Aktif</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            {plantings.length} <span className="text-sm font-semibold text-stone-500">Plot</span>
          </div>
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-1 flex-wrap">
            <span>Skala:</span> <strong className="text-stone-700">{scaleSummary.summaryText}</strong>
          </p>
        </div>

        {/* Tugas Hari Ini */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tugas Hari Ini</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            {todayTasks.length} <span className="text-sm font-semibold text-amber-600">Perlu Aksi</span>
          </div>
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
            {completedTodayTasks.length} tugas selesai hari ini
          </p>
        </div>

        {/* Panen Terdekat */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs hover:border-teal-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Panen Terdekat</span>
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            {nearestHarvest ? `${nearestHarvest.daysLeft}` : '—'} <span className="text-sm font-semibold text-teal-700">Hari Lagi</span>
          </div>
          <p className="text-xs text-stone-500 mt-1 truncate">
            {nearestHarvest ? `${nearestHarvest.crop_name} (${nearestHarvest.plot_name})` : 'Belum ada jadwal panen'}
          </p>
        </div>

        {/* Status Database */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Penyimpanan</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900">
            Realtime Sync
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            ✓ Supabase Cloud Master & Realtime
          </p>
        </div>
      </div>

      {/* Main Grid: Lahan Aktif & Tugas Mendesak */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kolom Kiri (7 Cols): Daftar Lahan Budidaya & Progress HST */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900">Status Lahan & Umur Tanaman (HST)</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-stone-200 text-stone-700">
                {activePlantings.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenManagePlots && (
                <button
                  type="button"
                  onClick={onOpenManagePlots}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/90 text-stone-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-200/80 shadow-2xs"
                  title="Kelola & Hapus Lahan Pertanian"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kelola Lahan</span>
                </button>
              )}
              {selectedPlotId !== 'all' && (
                <button
                  onClick={() => onSelectPlot('all')}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Lihat Semua Lahan
                </button>
              )}
            </div>
          </div>

          {activePlantings.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-stone-300 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl">
                🌱
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-800">Belum ada lahan budidaya aktif</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Data Anda baru saja terhapus saat membersihkan Google Chrome? Jangan khawatir! Anda dapat langsung memulihkan data budidaya lengkap (Padi, Jagung, Cabai beserta jadwal SOP dan catatan) dengan tombol di bawah.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                {onRestoreMasterData && (
                  <button
                    onClick={onRestoreMasterData}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                    Pulihkan Data Master Pertanian
                  </button>
                )}
                <button
                  onClick={onOpenNewPlanting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Tambah Lahan Baru
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {activePlantings.map((planting) => {
                const hst = calculateHST(planting.planting_date);
                const crop = DEFAULT_CROPS.find(c => c.id === planting.crop_id);
                const targetHst = crop ? crop.harvestDaysMax : 100;
                const progressPct = Math.min(100, Math.max(0, Math.round((hst / targetHst) * 100)));
                
                // Tasks for this specific plot
                const plotTasks = tasks.filter(t => t.planting_id === planting.id);
                const plotTasksPending = plotTasks.filter(t => !t.is_completed);

                return (
                  <div
                    key={planting.id}
                    className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs hover:shadow-md transition group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shadow-inner">
                          {crop?.icon || '🌱'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-stone-900 group-hover:text-emerald-700 transition">
                              {planting.plot_name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              {planting.crop_name}
                            </span>
                          </div>
                          {(() => {
                            const scale = formatPlantingScale(planting);
                            return (
                              <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                <span>Varietas: <strong>{planting.variety}</strong></span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <span>{scale.icon}</span>
                                  <span>{scale.primary}</span>
                                  {scale.secondary && <span className="text-stone-400 font-medium text-[11px]">({scale.secondary})</span>}
                                </span>
                              </p>
                            );
                          })()}
                        </div>
                      </div>

                      {/* HST Badge */}
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-sm shadow-xs">
                          <span>{hst} HST</span>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-1">
                          Tanam: {planting.planting_date}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar to Harvest */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-semibold text-stone-600">
                        <span>Fase Pertumbuhan ({progressPct}%)</span>
                        <span className="text-stone-500">
                          Target Panen: <strong>{planting.estimated_harvest_date}</strong> (~{targetHst} HST)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60">
                        <div 
                          className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Next task snippet */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-stone-600 truncate mr-2">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">
                          {plotTasksPending.length > 0 
                            ? `Tugas berikut: ${plotTasksPending[0].title} (${plotTasksPending[0].due_date})`
                            : 'Semua tugas budidaya telah diselesaikan! 🎉'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlantingToDelete(planting);
                          }}
                          title={`Hapus lahan pertanian "${planting.plot_name}"`}
                          className="px-3 py-1.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 transition flex items-center gap-1.5 cursor-pointer border border-rose-200/90 shadow-2xs font-bold text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus Lahan</span>
                        </button>

                        {onNavigateToAssistant && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPlot(planting.id);
                              onNavigateToAssistant();
                            }}
                            className="font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200/90 px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer text-xs"
                            title={`Tanya panduan perawatan AI untuk plot "${planting.plot_name}"`}
                          >
                            <Bot className="w-3.5 h-3.5 text-teal-600" />
                            <span>Tanya AI</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onSelectPlot(planting.id);
                            onNavigateToSchedule();
                          }}
                          className="font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer text-xs"
                        >
                          Detail Jadwal <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Care & Schedule Assistant Banner */}
          {onNavigateToAssistant && (
            <div className="bg-linear-to-r from-emerald-950 via-teal-950 to-stone-900 rounded-3xl p-5 sm:p-6 text-white border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base sm:text-lg">
                      Butuh Panduan Jadwal & Langkah Perawatan Khusus?
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-stone-950">
                      Asisten AI
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed">
                    Konsultasikan takaran pupuk kocor per pohon, cara membasmi hama & penyakit, atau minta AI membuatkan jadwal SOP perawatan otomatis untuk lahan Anda.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigateToAssistant}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>Konsultasi AI Sekarang</span>
              </button>
            </div>
          )}

          {/* Tips Agronomi & Cuaca */}
          <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Rekomendasi Lapangan & Manajemen Air</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Pastikan pemupukan dilakukan saat kondisi tanah cukup lembab (macak-macak) dan hindari memupuk saat hujan deras agar hara tidak tercuci (leaching). Untuk tanaman cabai dan tomat, lakukan sanitasi gulma di sela mulsa agar kelembaban tidak memicu spora jamur antraknosa.
            </p>
          </div>
        </div>

        {/* Kolom Kanan (5 Cols): Checklist Tugas Mendesak / Hari Ini */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900">Checklist Tindakan</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {todayTasks.length} Tertunda
              </span>
            </div>
            <button
              onClick={onNavigateToSchedule}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Lihat Kalender Lengkap
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-xs space-y-3">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider pb-2 border-b border-stone-100 flex items-center justify-between">
              <span>Aktivitas Berdasarkan HST</span>
              <span>Centang Jika Selesai</span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-stone-800">Tidak ada tugas tertunda hari ini!</h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Semua aktivitas perawatan lahan untuk hari ini telah tuntas. Cek menu jadwal untuk melihat agenda mendatang.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {todayTasks.map((task) => {
                  const planting = plantings.find(p => p.id === task.planting_id);
                  const isOverdue = task.due_date < todayStr;

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border transition flex items-start gap-3 ${
                        isOverdue 
                          ? 'bg-red-50/50 border-red-200' 
                          : 'bg-stone-50/80 border-stone-200 hover:border-emerald-300'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleCheckboxClick(task.id, task.is_completed)}
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition border shrink-0 cursor-pointer ${
                          task.is_completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-stone-300 hover:border-emerald-600'
                        }`}
                        title="Tandai Selesai"
                      >
                        {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-stone-200 text-stone-800 uppercase tracking-wider">
                            {task.hst} HST
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.category === 'pemupukan' ? 'bg-amber-100 text-amber-800' :
                            task.category === 'pengendalian_hama' ? 'bg-rose-100 text-rose-800' :
                            task.category === 'penyiangan' ? 'bg-emerald-100 text-emerald-800' :
                            task.category === 'penyiraman' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {task.category.replace('_', ' ')}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Terlewat
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 mt-1">
                          {task.title}
                        </h4>

                        {task.dosage && (
                          <div className="mt-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                            Takaran: {task.dosage}
                          </div>
                        )}

                        <div className="mt-1 text-[11px] text-stone-500 flex items-center justify-between">
                          <span>{planting?.plot_name}</span>
                          <span className="font-medium">Tenggat: {task.due_date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick add custom task shortcut */}
            <div className="pt-2 border-t border-stone-100">
              <button
                onClick={onNavigateToSchedule}
                className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <span>Buka Seluruh Timeline & Tugas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Konfirmasi Hapus Lahan */}
      {plantingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <button
                type="button"
                onClick={() => setPlantingToDelete(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-stone-900">
                Hapus Lahan Pertanian?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda yakin ingin menghapus plot lahan berikut ini?
              </p>
            </div>

            {/* Plot detail card */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-stone-800">
                <span>Nama Plot / Lahan:</span>
                <span className="text-rose-700">{plantingToDelete.plot_name}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Komoditas Tanaman:</span>
                <span className="font-semibold text-stone-800">{plantingToDelete.crop_name} ({plantingToDelete.variety})</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Skala / Luas:</span>
                <span className="font-semibold text-stone-800">
                  {formatPlantingScale(plantingToDelete).primary} {formatPlantingScale(plantingToDelete).secondary && `(${formatPlantingScale(plantingToDelete).secondary})`}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tanggal Tanam:</span>
                <span className="font-semibold text-stone-800">{plantingToDelete.planting_date}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Peringatan:</strong> Seluruh jadwal SOP, checklist tugas, catatan log, dan data buku kas yang terhubung dengan lahan ini akan ikut dihapus.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPlantingToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePlanting(plantingToDelete.id);
                  setPlantingToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Lahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
