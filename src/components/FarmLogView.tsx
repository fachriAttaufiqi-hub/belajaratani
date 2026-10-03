import React, { useState, useMemo } from 'react';
import { 
  BookOpenText, 
  DollarSign, 
  CloudSun, 
  Bug, 
  Plus, 
  Trash2, 
  Sun, 
  CloudRain, 
  CloudLightning, 
  Wind, 
  Calendar, 
  MapPin, 
  TrendingDown, 
  PieChart,
  Tag,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  MoreVertical,
  X,
  Droplets
} from 'lucide-react';
import { ActivityLog, ExpenseRecord, Planting } from '../types';
import { formatDate, generateUUID } from '../lib/storage';

interface FarmLogViewProps {
  plantings: Planting[];
  logs: ActivityLog[];
  expenses: ExpenseRecord[];
  selectedPlotId: string;
  onAddLog: (log: ActivityLog) => Promise<{ success: boolean; syncedToSupabase: boolean; error?: string }>;
  onDeleteLog: (logId: string) => Promise<{ success: boolean; error?: string }>;
  onAddExpense: (expense: ExpenseRecord) => Promise<{ success: boolean; syncedToSupabase: boolean; error?: string }>;
  onDeleteExpense: (expenseId: string) => Promise<{ success: boolean; error?: string }>;
}

export const FarmLogView: React.FC<FarmLogViewProps> = ({
  plantings,
  logs,
  expenses,
  selectedPlotId,
  onAddLog,
  onDeleteLog,
  onAddExpense,
  onDeleteExpense
}) => {
  const todayStr = formatDate(new Date());

  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'expenses'>('logs');
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Delete confirmation modals
  const [logToDelete, setLogToDelete] = useState<ActivityLog | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // New Log Form State
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isSubmittingLog, setIsSubmittingLog] = useState<boolean>(false);
  const [logPlotId, setLogPlotId] = useState<string>(plantings[0]?.id || '');
  const [logDate, setLogDate] = useState<string>(todayStr);
  const [logType, setLogType] = useState<ActivityLog['type']>('catatan_lapangan');
  const [logTitle, setLogTitle] = useState<string>('');
  const [logNotes, setLogNotes] = useState<string>('');
  const [logWeather, setLogWeather] = useState<ActivityLog['weather_condition']>('cerah');

  // New Expense Form State
  const [isExpModalOpen, setIsExpModalOpen] = useState<boolean>(false);
  const [isSubmittingExp, setIsSubmittingExp] = useState<boolean>(false);
  const [expPlotId, setExpPlotId] = useState<string>(plantings[0]?.id || '');
  const [expDate, setExpDate] = useState<string>(todayStr);
  const [expCategory, setExpCategory] = useState<ExpenseRecord['category']>('pupuk');
  const [expItemName, setExpItemName] = useState<string>('');
  const [expAmount, setExpAmount] = useState<number>(150000);
  const [expNotes, setExpNotes] = useState<string>('');

  // Filtered lists
  const filteredLogs = useMemo(() => {
    return logs.filter(l => selectedPlotId === 'all' || l.planting_id === selectedPlotId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, selectedPlotId]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => selectedPlotId === 'all' || e.planting_id === selectedPlotId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, selectedPlotId]);

  // Total expenses calculation
  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  // Active plot area
  const activeArea = useMemo(() => {
    if (selectedPlotId === 'all') {
      return plantings.reduce((acc, p) => acc + (Number(p.area_sqm) || 0), 0);
    }
    const found = plantings.find(p => p.id === selectedPlotId);
    return found ? Number(found.area_sqm) : 1000;
  }, [plantings, selectedPlotId]);

  const costPerSqm = activeArea > 0 ? Math.round(totalExpenseAmount / activeArea) : 0;

  // Breakdown expenses by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {
      pupuk: 0,
      benih: 0,
      pestisida: 0,
      tenaga_kerja: 0,
      peralatan: 0,
      lainnya: 0
    };
    filteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount || 0);
    });
    return map;
  }, [filteredExpenses]);

  // Handle Save Log with Supabase Status Feedback
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logPlotId || !logTitle.trim() || !logNotes.trim()) return;

    setIsSubmittingLog(true);

    const newLog: ActivityLog = {
      id: generateUUID(), // Valid UUID for Postgres!
      planting_id: logPlotId,
      date: logDate,
      type: logType,
      title: logTitle.trim(),
      notes: logNotes.trim(),
      weather_condition: logWeather
    };

    try {
      const res = await onAddLog(newLog);
      setIsLogModalOpen(false);
      setLogTitle('');
      setLogNotes('');

      if (res.syncedToSupabase) {
        showToast('Catatan lapangan berhasil disimpan langsung ke database Supabase!', 'success');
      } else if (res.error) {
        showToast(`Tersimpan di lokal. Catatan belum masuk ke Supabase (${res.error})`, 'warning');
      } else {
        showToast('Catatan tersimpan di memori perangkat (Lokal). Hubungkan Supabase untuk sync cloud.', 'success');
      }
    } catch (err: any) {
      showToast(`Gagal menyimpan catatan: ${err?.message}`, 'error');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Handle Save Expense with Supabase Status Feedback
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expPlotId || !expItemName.trim() || !expAmount) return;

    setIsSubmittingExp(true);

    const newExpense: ExpenseRecord = {
      id: generateUUID(), // Valid UUID for Postgres!
      planting_id: expPlotId,
      date: expDate,
      category: expCategory,
      item_name: expItemName.trim(),
      amount: Number(expAmount),
      notes: expNotes.trim()
    };

    try {
      const res = await onAddExpense(newExpense);
      setIsExpModalOpen(false);
      setExpItemName('');
      setExpNotes('');

      if (res.syncedToSupabase) {
        showToast('Pengeluaran berhasil dicatat langsung ke database Supabase!', 'success');
      } else if (res.error) {
        showToast(`Tersimpan di lokal. Supabase error: ${res.error}`, 'warning');
      } else {
        showToast('Pengeluaran berhasil dicatat secara lokal.', 'success');
      }
    } catch (err: any) {
      showToast(`Gagal mencatat pengeluaran: ${err?.message}`, 'error');
    } finally {
      setIsSubmittingExp(false);
    }
  };

  // Handle Delete Confirmation
  const confirmDeleteLog = async () => {
    if (!logToDelete) return;
    setIsDeleting(true);
    try {
      const res = await onDeleteLog(logToDelete.id);
      if (res.success) {
        showToast('Catatan berhasil dihapus dari Supabase & memori lokal.', 'success');
      } else {
        showToast(`Gagal menghapus di Supabase: ${res.error}`, 'warning');
      }
    } catch (err: any) {
      showToast(`Error: ${err?.message}`, 'error');
    } finally {
      setIsDeleting(false);
      setLogToDelete(null);
    }
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      const res = await onDeleteExpense(expenseToDelete.id);
      if (res.success) {
        showToast('Biaya operasional berhasil dihapus dari Supabase & memori lokal.', 'success');
      } else {
        showToast(`Gagal menghapus di Supabase: ${res.error}`, 'warning');
      }
    } catch (err: any) {
      showToast(`Error: ${err?.message}`, 'error');
    } finally {
      setIsDeleting(false);
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`p-4 rounded-2xl shadow-lg border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'success' 
            ? 'bg-emerald-900 text-emerald-100 border-emerald-700' 
            : toast.type === 'warning'
            ? 'bg-amber-900 text-amber-100 border-amber-700'
            : 'bg-rose-900 text-rose-100 border-rose-700'
        }`}>
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            Buku Catatan Digital & Finansial Lahan
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Rekam pengamatan harian, serangan hama, cuaca, penyiraman, dan arus kas operasional tani dengan sinkronisasi Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'logs' ? (
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Catat Pengamatan Lahan
            </button>
          ) : (
            <button
              onClick={() => setIsExpModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Catat Pengeluaran (Biaya)
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-3 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <BookOpenText className="w-4 h-4" />
          <span>Jurnal Pengamatan & Hama ({filteredLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'expenses'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Buku Kas & Biaya Operasional ({filteredExpenses.length})</span>
        </button>
      </div>

      {/* TAB 1: LOGS & OBSERVATIONS */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-dashed border-stone-300 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
                📝
              </div>
              <h3 className="text-base font-bold text-stone-800">Belum ada catatan pengamatan</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Catat kondisi daun, cuaca, serangan hama, atau takaran pupuk yang telah diaplikasikan.
              </p>
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" /> Buat Catatan Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLogs.map((log) => {
                const planting = plantings.find(p => p.id === log.planting_id);

                return (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            log.type === 'hama_penyakit' ? 'bg-rose-100 text-rose-800' :
                            log.type === 'cuaca' ? 'bg-blue-100 text-blue-800' :
                            log.type === 'panen' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {log.type === 'hama_penyakit' ? '🛡️ Hama / Penyakit' :
                             log.type === 'cuaca' ? '🌦️ Cuaca' :
                             log.type === 'panen' ? '🌾 Hasil Panen' :
                             '🌱 Pengamatan'}
                          </span>

                          {log.weather_condition && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 flex items-center gap-1">
                              {log.weather_condition === 'cerah' && <Sun className="w-3 h-3 text-amber-500" />}
                              {log.weather_condition === 'hujan_deras' && <CloudLightning className="w-3 h-3 text-blue-600" />}
                              {log.weather_condition === 'hujan_ringan' && <CloudRain className="w-3 h-3 text-blue-400" />}
                              {log.weather_condition === 'berawan' && <CloudSun className="w-3 h-3 text-stone-500" />}
                              {log.weather_condition.replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-semibold text-stone-500 flex items-center gap-1 shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                          {log.date}
                        </span>
                      </div>

                      <h3 className="font-bold text-stone-900 text-sm sm:text-base mt-1">
                        {log.title}
                      </h3>

                      <p className="text-xs text-stone-600 mt-2 leading-relaxed whitespace-pre-line bg-stone-50 p-3 rounded-xl border border-stone-100">
                        {log.notes}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
                      <span className="flex items-center gap-1 font-medium truncate mr-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        {planting ? `${planting.plot_name} (${planting.crop_name})` : 'Lahan'}
                      </span>

                      {/* Menu Hapus */}
                      <button
                        onClick={() => setLogToDelete(log)}
                        className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        title="Hapus Catatan Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Catatan</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPENSES & CASHFLOW */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase">Total Biaya Operasional</span>
              <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
                Rp {totalExpenseAmount.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Akumulasi seluruh sarana produksi & upah kerja
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase">Biaya Modal per m²</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                Rp {costPerSqm.toLocaleString('id-ID')} <span className="text-xs font-semibold text-stone-500">/ m²</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Luas lahan yang dievaluasi: {activeArea.toLocaleString('id-ID')} m²
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase">Alokasi Pupuk & Benih</span>
              <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
                Rp {((expenseByCategory.pupuk || 0) + (expenseByCategory.benih || 0)).toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Pupuk: Rp {(expenseByCategory.pupuk || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Expense Table / List */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-stone-900">
                Rincian Transaksi Pengeluaran
              </h3>
              <span className="text-xs font-bold text-stone-500">
                {filteredExpenses.length} Transaksi Tercatat
              </span>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500">
                Belum ada pengeluaran tercatat untuk plot ini.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredExpenses.map((exp) => {
                  const planting = plantings.find(p => p.id === exp.planting_id);

                  return (
                    <div
                      key={exp.id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-stone-50/80 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          exp.category === 'pupuk' ? 'bg-amber-100 text-amber-800' :
                          exp.category === 'benih' ? 'bg-emerald-100 text-emerald-800' :
                          exp.category === 'pestisida' ? 'bg-rose-100 text-rose-800' :
                          exp.category === 'tenaga_kerja' ? 'bg-blue-100 text-blue-800' :
                          'bg-stone-100 text-stone-800'
                        }`}>
                          {exp.category === 'pupuk' ? '🌱' :
                           exp.category === 'benih' ? '🌾' :
                           exp.category === 'pestisida' ? '🧪' :
                           exp.category === 'tenaga_kerja' ? '👨‍🌾' : '📦'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                              {exp.item_name}
                            </h4>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 shrink-0">
                              {exp.category.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2 truncate">
                            <span>{exp.date}</span>
                            <span>•</span>
                            <span className="truncate">{planting?.plot_name || 'Lahan'}</span>
                            {exp.notes && (
                              <>
                                <span>•</span>
                                <span className="italic truncate">"{exp.notes}"</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-extrabold text-sm sm:text-base text-stone-900">
                          Rp {Number(exp.amount).toLocaleString('id-ID')}
                        </span>
                        
                        {/* Menu Hapus Pengeluaran */}
                        <button
                          onClick={() => setExpenseToDelete(exp)}
                          className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition font-bold text-xs flex items-center gap-1 cursor-pointer"
                          title="Hapus Biaya Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Log */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-stone-900">
                Hapus Catatan Pengamatan?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Catatan <strong>"{logToDelete.title}"</strong> ({logToDelete.date}) akan dihapus secara permanen dari Supabase dan penyimpanan lokal.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setLogToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteLog}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Expense */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-stone-900">
                Hapus Catatan Pengeluaran?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Biaya <strong>"{expenseToDelete.item_name}"</strong> sebesar <strong>Rp {expenseToDelete.amount.toLocaleString('id-ID')}</strong> akan dihapus permanen dari Supabase dan catatan kas lahan.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteExpense}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Log */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className="bg-emerald-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpenText className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Tambah Catatan Lapangan / Hama</h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Pilih Lahan / Plot</label>
                <select
                  value={logPlotId}
                  onChange={(e) => setLogPlotId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                  required
                >
                  {plantings.map(p => (
                    <option key={p.id} value={p.id}>{p.plot_name} — {p.crop_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tipe Catatan</label>
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as any)}
                    className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                  >
                    <option value="catatan_lapangan">🌱 Catatan Lapangan</option>
                    <option value="hama_penyakit">🛡️ Gejala Hama / Penyakit</option>
                    <option value="cuaca">🌦️ Kondisi Cuaca</option>
                    <option value="panen">🌾 Hasil Panen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Kondisi Cuaca Saat Pengamatan</label>
                <select
                  value={logWeather}
                  onChange={(e) => setLogWeather(e.target.value as any)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                >
                  <option value="cerah">☀️ Cerah Panas</option>
                  <option value="berawan">⛅ Berawan Teduh</option>
                  <option value="hujan_ringan">🌧️ Hujan Ringan (Gerimis)</option>
                  <option value="hujan_deras">⛈️ Hujan Deras</option>
                  <option value="kering_panas">🏜️ Kering Terik</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Judul Ringkasan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ditemukan ulat grayak di daun muda, atau tinggi tanaman 40 cm"
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Deskripsi / Detail Tindakan</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan catatan lapangan secara mendalam..."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLog}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingLog ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  <span>{isSubmittingLog ? 'Menyimpan ke Supabase...' : 'Simpan ke Supabase & Lokal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Expense */}
      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className="bg-emerald-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Catat Pengeluaran (Biaya Operasional)</h3>
              </div>
              <button
                onClick={() => setIsExpModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Pilih Lahan / Plot</label>
                <select
                  value={expPlotId}
                  onChange={(e) => setExpPlotId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                  required
                >
                  {plantings.map(p => (
                    <option key={p.id} value={p.id}>{p.plot_name} — {p.crop_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Kategori Biaya</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                  >
                    <option value="pupuk">🌱 Pupuk</option>
                    <option value="benih">🌾 Benih / Bibit</option>
                    <option value="pestisida">🧪 Pestisida / Fungisida</option>
                    <option value="tenaga_kerja">👨‍🌾 Upah Buruh / Tenaga Kerja</option>
                    <option value="peralatan">🛠️ Peralatan / Mulsa / Ajir</option>
                    <option value="lainnya">📦 Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Barang / Deskripsi Biaya</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: NPK Mutiara 1 Karung (50 kg)"
                  value={expItemName}
                  onChange={(e) => setExpItemName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-500">Rp</span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 font-bold text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Beli di Kios Tani Berkah"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExp}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingExp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  <span>{isSubmittingExp ? 'Menyimpan ke Supabase...' : 'Simpan ke Supabase & Lokal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
