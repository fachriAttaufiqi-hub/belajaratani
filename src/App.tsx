import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ScheduleView } from './components/ScheduleView';
import { FarmLogView } from './components/FarmLogView';
import { GuideView } from './components/GuideView';
import { NewPlantingModal } from './components/NewPlantingModal';
import { FertilizerCalcModal } from './components/FertilizerCalcModal';
import { SupabaseModal } from './components/SupabaseModal';
import { ManagePlotsModal } from './components/ManagePlotsModal';
import { FarmDB } from './lib/storage';
import { getSavedSupabaseConfig, checkAndApplyUrlSync, restoreSupabaseConfigFromIdb } from './lib/supabase';
import { ActivityLog, ExpenseRecord, Planting, TaskItem } from './types';
import { Smartphone, ShieldCheck, Download, RotateCcw } from 'lucide-react';

export default function App() {
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'logs' | 'guide'>('dashboard');

  // Modals
  const [isNewPlantingOpen, setIsNewPlantingOpen] = useState<boolean>(false);
  const [isFertilizerCalcOpen, setIsFertilizerCalcOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isManagePlotsOpen, setIsManagePlotsOpen] = useState<boolean>(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [appToast, setAppToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showAppToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setAppToast({ message, type });
    setTimeout(() => setAppToast(null), 4000);
  };

  // Load all data with auto-restoration if empty
  const loadData = useCallback(async () => {
    try {
      let [allPlantings, allTasks, allLogs, allExpenses] = await Promise.all([
        FarmDB.getPlantings(),
        FarmDB.getTasks(),
        FarmDB.getLogs(),
        FarmDB.getExpenses()
      ]);

      // Jika data kosong karena baru dibersihkan browser Chrome (belum pernah diinisialisasi), otomatis pulihkan data master
      if (!allPlantings || allPlantings.length === 0) {
        const isInit = localStorage.getItem('taniguide_initialized');
        if (!isInit) {
          const restored = await FarmDB.restoreMasterData();
          if (restored && restored.data) {
            allPlantings = restored.data.plantings || [];
            allTasks = restored.data.tasks || [];
            allLogs = restored.data.logs || [];
            allExpenses = restored.data.expenses || [];
          }
        }
      }

      setPlantings(allPlantings);
      setTasks(allTasks);
      setLogs(allLogs);
      setExpenses(allExpenses);

      const config = getSavedSupabaseConfig();
      setIsSupabaseConnected(config.isConfigured);
    } catch (err) {
      console.error('Gagal memuat data pertanian:', err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await restoreSupabaseConfigFromIdb();
      const urlSync = checkAndApplyUrlSync();
      if (urlSync.applied) {
        showAppToast(urlSync.message || 'Koneksi Supabase otomatis disinkronkan!', 'success');
      }
      await loadData();
    }
    init();
  }, [loadData]);

  // Handle adding new planting + auto generated schedule
  const handleSavePlanting = async (planting: Planting) => {
    const { planting: savedPlanting, tasks: newTasks, syncedToSupabase, error } = await FarmDB.addPlanting(planting);
    setPlantings(prev => [savedPlanting, ...prev]);
    setTasks(prev => [...newTasks, ...prev]);
    setSelectedPlotId(savedPlanting.id);
    setActiveTab('schedule'); // Switch to schedule view to see the generated timeline immediately!

    if (syncedToSupabase) {
      showAppToast(`Lahan "${savedPlanting.plot_name}" berhasil disimpan ke Cloud Supabase & bisa dibuka di semua gawai!`, 'success');
    } else if (error) {
      showAppToast(`Lahan disimpan di gawai ini saja. Error Supabase: ${error}`, 'warning');
    } else {
      showAppToast(`Lahan "${savedPlanting.plot_name}" tersimpan di gawai ini (Lokal). Hubungkan Supabase agar otomatis muncul di gawai lain.`, 'warning');
    }
  };

  // Handle deleting planting
  const handleDeletePlanting = async (plotId: string) => {
    const target = plantings.find(p => p.id === plotId);
    const plotName = target ? target.plot_name : 'lahan';
    await FarmDB.deletePlanting(plotId);
    setPlantings(prev => prev.filter(p => p.id !== plotId));
    setTasks(prev => prev.filter(t => t.planting_id !== plotId));
    setLogs(prev => prev.filter(l => l.planting_id !== plotId));
    setExpenses(prev => prev.filter(e => e.planting_id !== plotId));
    if (selectedPlotId === plotId) {
      setSelectedPlotId('all');
    }
    showAppToast(`Lahan "${plotName}" beserta seluruh jadwal dan catatannya berhasil dihapus.`, 'success');
  };

  // Handle task completion toggle
  const handleToggleTask = async (taskId: string, isCompleted: boolean, notes?: string) => {
    // optimistic update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          completion_notes: notes || t.completion_notes
        };
      }
      return t;
    }));

    await FarmDB.toggleTaskCompletion(taskId, isCompleted, notes);
  };

  // Handle adding custom task
  const handleAddTask = async (task: TaskItem) => {
    const res = await FarmDB.addTask(task);
    setTasks(prev => [res.task, ...prev]);
    return { success: true, syncedToSupabase: res.syncedToSupabase, error: res.error };
  };

  // Handle deleting task
  const handleDeleteTask = async (taskId: string) => {
    const res = await FarmDB.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    return res;
  };

  // Handle adding activity log
  const handleAddLog = async (log: ActivityLog) => {
    const res = await FarmDB.addLog(log);
    setLogs(prev => [res.log, ...prev]);
    return { success: true, syncedToSupabase: res.syncedToSupabase, error: res.error };
  };

  // Handle deleting log
  const handleDeleteLog = async (logId: string) => {
    const res = await FarmDB.deleteLog(logId);
    setLogs(prev => prev.filter(l => l.id !== logId));
    return res;
  };

  // Handle adding expense
  const handleAddExpense = async (expense: ExpenseRecord) => {
    const res = await FarmDB.addExpense(expense);
    setExpenses(prev => [res.expense, ...prev]);
    return { success: true, syncedToSupabase: res.syncedToSupabase, error: res.error };
  };

  // Handle deleting expense
  const handleDeleteExpense = async (expenseId: string) => {
    const res = await FarmDB.deleteExpense(expenseId);
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    return res;
  };

  // Handle restoring master farm dataset (Padi, Jagung, Cabai)
  const handleRestoreMasterData = async () => {
    const res = await FarmDB.restoreMasterData();
    if (res.success) {
      await loadData();
      showAppToast(res.message, 'success');
    } else {
      showAppToast('Gagal memulihkan data', 'error');
    }
  };

  // Guide: quick start planting with specific crop
  const handleStartPlantingWithCrop = (cropId: string) => {
    setIsNewPlantingOpen(true);
  };

  const handleQuickExportBackup = async () => {
    try {
      const json = await FarmDB.exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `taniguide_cadangan_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      showAppToast('File cadangan data pertanian (.json) berhasil diunduh!', 'success');
    } catch {
      showAppToast('Gagal mengunduh file cadangan', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Top Navbar */}
      <Navbar
        plantings={plantings}
        selectedPlotId={selectedPlotId}
        onSelectPlot={setSelectedPlotId}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewPlanting={() => setIsNewPlantingOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenFertilizerCalc={() => setIsFertilizerCalcOpen(true)}
        onOpenManagePlots={() => setIsManagePlotsOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        onRestoreMasterData={handleRestoreMasterData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4">
        
        {/* Floating App Toast Notification */}
        {appToast && (
          <div className={`p-4 rounded-2xl shadow-lg border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
            appToast.type === 'success' 
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700' 
              : appToast.type === 'warning'
              ? 'bg-amber-900 text-amber-100 border-amber-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}>
            <span>{appToast.message}</span>
            <button
              onClick={() => setAppToast(null)}
              className="text-white hover:opacity-75 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Device Sync & Data Protection Bar */}
        <div className={`rounded-2xl p-3 sm:p-4 border transition-all ${
          isSupabaseConnected 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-2xs' 
            : 'bg-amber-50/90 border-amber-200/90 text-amber-950 shadow-2xs'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className={`p-2 rounded-xl shrink-0 ${isSupabaseConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {isSupabaseConnected ? <ShieldCheck className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-xs sm:text-sm">
                    {isSupabaseConnected 
                      ? 'Cloud Supabase Aktif: Data Aman dari Hapus Chrome & Terhubung di Semua HP' 
                      : 'Proteksi Data Ganda Aktif (LocalStorage + IndexedDB)'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSupabaseConnected ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {isSupabaseConnected ? 'Cloud Online' : 'Mode Offline'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs opacity-90 mt-0.5 leading-relaxed">
                  {isSupabaseConnected
                    ? 'Data lahan, jadwal, dan catatan tersimpan aman di cloud. Gunakan tautan atau QR Code untuk menyinkronkan ke HP/tablet Anda.'
                    : 'Data Anda sekarang dilindungi cadangan otomatis agar tidak hilang saat Google Chrome dibersihkan. Hubungkan Supabase agar otomatis sama di HP lain.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition ${
                  isSupabaseConnected
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isSupabaseConnected ? 'Buka di HP Lain' : 'Sinkronkan ke Gawai Lain'}</span>
              </button>

              <button
                onClick={handleQuickExportBackup}
                title="Unduh file cadangan data JSON"
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Cadangan JSON</span>
              </button>

              <button
                onClick={handleRestoreMasterData}
                title="Pulihkan seluruh data master pertanian"
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Pulihkan Master</span>
              </button>
            </div>
          </div>
        </div>
        
        {activeTab === 'dashboard' && (
          <DashboardView
            plantings={plantings}
            tasks={tasks}
            selectedPlotId={selectedPlotId}
            onSelectPlot={setSelectedPlotId}
            onToggleTask={handleToggleTask}
            onNavigateToSchedule={() => setActiveTab('schedule')}
            onOpenNewPlanting={() => setIsNewPlantingOpen(true)}
            onDeletePlanting={handleDeletePlanting}
            onOpenManagePlots={() => setIsManagePlotsOpen(true)}
            onRestoreMasterData={handleRestoreMasterData}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            plantings={plantings}
            tasks={tasks}
            selectedPlotId={selectedPlotId}
            onSelectPlot={setSelectedPlotId}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onOpenNewPlanting={() => setIsNewPlantingOpen(true)}
            onDeletePlanting={handleDeletePlanting}
            onOpenManagePlots={() => setIsManagePlotsOpen(true)}
          />
        )}

        {activeTab === 'logs' && (
          <FarmLogView
            plantings={plantings}
            logs={logs}
            expenses={expenses}
            selectedPlotId={selectedPlotId}
            onAddLog={handleAddLog}
            onDeleteLog={handleDeleteLog}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'guide' && (
          <GuideView
            onStartPlantingWithCrop={handleStartPlantingWithCrop}
            onOpenFertilizerCalc={() => setIsFertilizerCalcOpen(true)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-800">TaniGuide</span>
            <span>•</span>
            <span>Sistem Otomatisasi Jadwal & Catatan Digital Pertanian</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="hover:text-emerald-700 font-semibold cursor-pointer"
            >
              Lihat Skrip DDL SQL Supabase
            </button>
            <span>•</span>
            <button
              onClick={() => setIsFertilizerCalcOpen(true)}
              className="hover:text-emerald-700 font-semibold cursor-pointer"
            >
              Kalkulator Dosis Pupuk
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NewPlantingModal
        isOpen={isNewPlantingOpen}
        onClose={() => setIsNewPlantingOpen(false)}
        onSavePlanting={handleSavePlanting}
      />

      <ManagePlotsModal
        isOpen={isManagePlotsOpen}
        onClose={() => setIsManagePlotsOpen(false)}
        plantings={plantings}
        tasks={tasks}
        logs={logs}
        expenses={expenses}
        onSelectPlot={setSelectedPlotId}
        onDeletePlanting={handleDeletePlanting}
        onOpenNewPlanting={() => setIsNewPlantingOpen(true)}
        onNavigateToSchedule={(plotId) => {
          setSelectedPlotId(plotId);
          setActiveTab('schedule');
        }}
        onRestoreMasterData={handleRestoreMasterData}
      />

      <FertilizerCalcModal
        isOpen={isFertilizerCalcOpen}
        onClose={() => setIsFertilizerCalcOpen(false)}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChanged={loadData}
      />

    </div>
  );
}
