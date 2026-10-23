import React, { useState } from 'react';
import { 
  Sprout, 
  Trash2, 
  X, 
  AlertTriangle, 
  Plus, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ChevronRight
} from 'lucide-react';
import { Planting, TaskItem, ActivityLog, ExpenseRecord } from '../types';
import { calculateHST } from '../lib/storage';
import { formatPlantingScale, summarizePlantingsScale } from '../lib/scaleUnits';

interface ManagePlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantings: Planting[];
  tasks: TaskItem[];
  logs: ActivityLog[];
  expenses: ExpenseRecord[];
  onSelectPlot: (plotId: string) => void;
  onDeletePlanting: (plotId: string) => Promise<void> | void;
  onOpenNewPlanting: () => void;
  onNavigateToSchedule: (plotId: string) => void;
}

export const ManagePlotsModal: React.FC<ManagePlotsModalProps> = ({
  isOpen,
  onClose,
  plantings,
  tasks,
  logs,
  expenses,
  onSelectPlot,
  onDeletePlanting,
  onOpenNewPlanting,
  onNavigateToSchedule
}) => {
  const [plotToDelete, setPlotToDelete] = useState<Planting | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!isOpen) return null;

  const scaleSummary = summarizePlantingsScale(plantings);
  const totalAreaSqm = scaleSummary.totalSqm;
  const totalAreaHa = scaleSummary.totalHa;

  const handleDeleteConfirm = async () => {
    if (!plotToDelete) return;
    try {
      setIsDeleting(true);
      await onDeletePlanting(plotToDelete.id);
      setPlotToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-inner">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Kelola Lahan Pertanian
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-emerald-100">
                  {plantings.length} Plot
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Daftar lengkap lahan budidaya, kontrol plot tanam, dan fungsi hapus lahan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewPlanting();
              }}
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Tambah Lahan</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-5 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div>
            <span className="text-stone-500 font-medium block">Total Lahan</span>
            <span className="text-stone-900 font-extrabold text-sm sm:text-base">
              {plantings.length} Plot Aktif
            </span>
          </div>
          <div>
            <span className="text-stone-500 font-medium block">Total Skala Budidaya</span>
            <span className="text-stone-900 font-extrabold text-xs sm:text-sm line-clamp-1" title={scaleSummary.summaryText}>
              {scaleSummary.summaryText}
            </span>
          </div>
          <div>
            <span className="text-stone-500 font-medium block">Total Agenda SOP</span>
            <span className="text-emerald-700 font-extrabold text-sm sm:text-base">
              {tasks.length} Kegiatan
            </span>
          </div>
          <div>
            <span className="text-stone-500 font-medium block">Catatan Lapangan</span>
            <span className="text-stone-900 font-extrabold text-sm sm:text-base">
              {logs.length} Log & Biaya
            </span>
          </div>
        </div>

        {/* Modal Body / Plot List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {plantings.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-4 bg-stone-50 rounded-3xl border border-dashed border-stone-300">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl">
                🌱
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-stone-800">Belum ada lahan pertanian di Supabase</h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Lahan budidaya yang Anda buat langsung tersimpan ke Supabase Cloud dan sinkron realtime.
                </p>
              </div>
              <div className="flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewPlanting();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Tambah Lahan Baru</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {plantings.map((planting) => {
                const hst = calculateHST(planting.planting_date);
                const plantingDateMs = new Date(planting.planting_date).getTime();
                const harvestDateMs = planting.estimated_harvest_date ? new Date(planting.estimated_harvest_date).getTime() : 0;
                const diffDays = harvestDateMs > plantingDateMs ? Math.round((harvestDateMs - plantingDateMs) / (1000 * 60 * 60 * 24)) : 90;
                const targetHst = diffDays > 0 ? diffDays : 90;
                const progressPct = Math.min(100, Math.max(0, Math.round((hst / targetHst) * 100)));

                const cropNameLower = (planting.crop_name || '').toLowerCase();
                const cropIcon = cropNameLower.includes('cabai') ? '🌶️' :
                                 cropNameLower.includes('jagung') ? '🌽' :
                                 cropNameLower.includes('padi') ? '🌾' :
                                 cropNameLower.includes('bawang') ? '🧅' :
                                 cropNameLower.includes('tomat') ? '🍅' :
                                 cropNameLower.includes('melon') || cropNameLower.includes('semangka') ? '🍉' : '🌱';

                const plotTasks = tasks.filter(t => t.planting_id === planting.id);
                const plotTasksCompleted = plotTasks.filter(t => t.is_completed).length;
                const plotLogs = logs.filter(l => l.planting_id === planting.id);
                const plotExpenses = expenses.filter(e => e.planting_id === planting.id);
                const totalCost = plotExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

                return (
                  <div
                    key={planting.id}
                    className="bg-stone-50 hover:bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                          {cropIcon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-base text-stone-900">
                              {planting.plot_name}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              {planting.crop_name} ({planting.variety})
                            </span>
                            {(() => {
                              const scale = formatPlantingScale(planting);
                              return (
                                <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300">
                                  <span>{scale.icon}</span>
                                  <span>{scale.primary}</span>
                                  {scale.secondary && <span className="text-stone-500 font-medium text-[11px]">({scale.secondary})</span>}
                                </span>
                              );
                            })()}
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-stone-500 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-stone-400" />
                              Tanam: <strong>{planting.planting_date}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Estimasi Panen: <strong>{planting.estimated_harvest_date}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-bold text-emerald-700">
                              {hst} HST (~{targetHst} hari total)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* HST badge */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-2xs">
                          {hst} HST
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-stone-500">
                        <span>Fase Pertumbuhan ({progressPct}%)</span>
                        <span>{plotTasksCompleted} dari {plotTasks.length} tugas selesai</span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta stats & Action buttons */}
                    <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 text-stone-600 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <strong>{plotTasks.length}</strong> Agenda SOP
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <strong>{plotLogs.length}</strong> Catatan
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                          Biaya: <strong>Rp {totalCost.toLocaleString('id-ID')}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Tombol Hapus Lahan Pertanian */}
                        <button
                          type="button"
                          onClick={() => setPlotToDelete(planting)}
                          title={`Hapus lahan ${planting.plot_name}`}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs hover:border-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus Lahan</span>
                        </button>

                        {/* Tombol Buka Jadwal Plot Ini */}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPlot(planting.id);
                            onNavigateToSchedule(planting.id);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <span>Buka Jadwal</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0 text-xs text-stone-500">
          <span>
            {plantings.length > 0 
              ? 'Menghapus lahan akan membersihkan agenda tugas, catatan, dan pengeluaran terkait.' 
              : 'Gunakan tombol di atas untuk menambahkan lahan baru.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold hover:bg-stone-100 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Confirmation Modal: Hapus Lahan */}
      {plotToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <button
                type="button"
                onClick={() => setPlotToDelete(null)}
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
                Apakah Anda yakin ingin menghapus plot lahan pertanian berikut?
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-stone-800">
                <span>Nama Plot / Lahan:</span>
                <span className="text-rose-700">{plotToDelete.plot_name}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Komoditas:</span>
                <span className="font-semibold text-stone-800">
                  {plotToDelete.crop_name} ({plotToDelete.variety})
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Skala / Luas Lahan:</span>
                <span className="font-semibold text-stone-800">
                  {formatPlantingScale(plotToDelete).primary} {formatPlantingScale(plotToDelete).secondary ? `(${formatPlantingScale(plotToDelete).secondary})` : ''}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tanggal Tanam:</span>
                <span className="font-semibold text-stone-800">
                  {plotToDelete.planting_date}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Peringatan:</strong> Seluruh jadwal SOP, checklist tugas harian, catatan log lapangan, dan data pengeluaran untuk plot ini akan ikut dihapus secara permanen.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPlotToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Lahan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
