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
import { AIAssistantView } from './components/AIAssistantView';
import { FarmDB } from './lib/storage';
import { getSavedSupabaseConfig, checkAndApplyUrlSync, syncSupabaseConfigFromAllSources, subscribeToSupabaseRealtime } from './lib/supabase';
import { ActivityLog, ExpenseRecord, Planting, TaskItem } from './types';
import { Smartphone, ShieldCheck, Download, RotateCcw, Key, Sparkles, Radio, Bot } from 'lucide-react';

export default function App() {
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'logs' | 'guide' | 'assistant'>('dashboard');

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

  // Load all data from Supabase Master
  const loadData = useCallback(async () => {
    try {
      const [allPlantings, allTasks, allLogs, allExpenses] = await Promise.all([
        FarmDB.getPlantings(),
        FarmDB.getTasks(),
        FarmDB.getLogs(),
        FarmDB.getExpenses()
      ]);

      setPlantings(allPlantings);
      setTasks(allTasks);
      setLogs(allLogs);
      setExpenses(allExpenses);

      const config = getSavedSupabaseConfig();
      setIsSupabaseConnected(config.isConfigured);
    } catch (err) {
      console.error('Gagal memuat data pertanian dari Supabase Master:', err);
    }
  }, []);

  useEffect(() => {
    let unsubscribeRealtime: (() => void) | null = null;
    let isMounted = true;

    async function init() {
      // 1. Ambil config Supabase yang terkunci di Server Backend (semua gawai otomatis terhubung)
      const configRes = await syncSupabaseConfigFromAllSources();
      if (!isMounted) return;
      setIsSupabaseConnected(configRes.isConfigured);

      // 2. Periksa parameter sync URL jika ada
      const urlSync = checkAndApplyUrlSync();
      if (urlSync.applied) {
        showAppToast(urlSync.message || 'Koneksi Supabase otomatis dikunci!', 'success');
      }

      // 3. Muat data awal dari Supabase Master
      await loadData();

      // 4. Langganan Realtime Supabase untuk sinkronisasi otomatis antar-perangkat seketika
      let reloadTimeout: any = null;
      unsubscribeRealtime = subscribeToSupabaseRealtime((table) => {
        if (!isMounted) return;
        console.log(`⚡ [Realtime Update Received]: ${table}`);
        if (reloadTimeout) clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
          loadData();
        }, 150);
      });
    }

    init();

    return () => {
      isMounted = false;
      if (unsubscribeRealtime) {
        unsubscribeRealtime();
      }
    };
  }, [loadData]);

  const handleConnectionChanged = async () => {
    const configRes = await syncSupabaseConfigFromAllSources();
    setIsSupabaseConnected(configRes.isConfigured);
    await loadData();
    subscribeToSupabaseRealtime(() => {
      loadData();
    });
  };

  // Handle adding new planting + auto generated schedule
  const handleSavePlanting = async (planting: Planting) => {
    const { planting: savedPlanting, tasks: newTasks, syncedToSupabase, error } = await FarmDB.addPlanting(planting);
    setPlantings(prev => [savedPlanting, ...prev]);
    setTasks(prev => [...newTasks, ...prev]);
    setSelectedPlotId(savedPlanting.id);
    setActiveTab('schedule'); // Switch to schedule view to see the generated timeline immediately!

    if (syncedToSupabase) {
      showAppToast(`Lahan "${savedPlanting.plot_name}" berhasil disimpan ke Supabase Master & tersinkronisasi ke seluruh gawai!`, 'success');
    } else if (error) {
      showAppToast(`Lahan tersimpan. Status Supabase: ${error}`, 'warning');
    } else {
      showAppToast(`Lahan "${savedPlanting.plot_name}" berhasil dibuat.`, 'success');
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

        {/* Cloud Supabase Master & Realtime Multi-Device Bar */}
        <div className={`rounded-3xl p-4 sm:p-5 border transition-all ${
          isSupabaseConnected 
            ? 'bg-linear-to-r from-emerald-950 via-teal-950 to-stone-900 text-white border-emerald-500/40 shadow-lg' 
            : 'bg-linear-to-r from-stone-900 via-stone-800 to-amber-950 text-white border-amber-500/40 shadow-lg'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`p-3 rounded-2xl shrink-0 ${
                isSupabaseConnected 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}>
                {isSupabaseConnected ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : <Key className="w-6 h-6 text-amber-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight">
                    {isSupabaseConnected 
                      ? 'Supabase Cloud Master Aktif • Terkunci Otomatis untuk Semua Gawai' 
                      : 'Kunci Supabase untuk Seluruh Gawai (Tidak Perlu Masukkan Kunci Lagi)'}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                    isSupabaseConnected ? 'bg-emerald-500 text-stone-950' : 'bg-amber-400 text-stone-950'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping"></span>
                    {isSupabaseConnected ? '⚡ Realtime Master' : 'Perlu Kunci'}
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed max-w-3xl">
                  {isSupabaseConnected
                    ? 'Data di Supabase menjadi master tunggal. Seluruh perangkat (HP, laptop, tablet) tersinkronisasi realtime seketika tanpa perlu memasukkan kunci lagi.'
                    : 'Kunci Supabase URL dan Anon Key satu kali di sini agar tersimpan permanen di server & dapat dibuka langsung di seluruh gawai Anda.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-md transition active:scale-95 ${
                  isSupabaseConnected
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                    : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>{isSupabaseConnected ? 'Kelola Kunci Supabase' : 'Kunci Supabase Sekarang'}</span>
              </button>

              <button
                onClick={handleQuickExportBackup}
                title="Unduh file cadangan data JSON"
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Cadangan JSON</span>
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
            onNavigateToAssistant={() => setActiveTab('assistant')}
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
            onNavigateToAssistant={() => setActiveTab('assistant')}
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

        {activeTab === 'assistant' && (
          <AIAssistantView
            plantings={plantings}
            tasks={tasks}
            selectedPlotId={selectedPlotId}
            onSelectPlot={setSelectedPlotId}
            onAddTask={handleAddTask}
            onNavigateToSchedule={() => setActiveTab('schedule')}
          />
        )}

      </main>

      {/* Floating AI Assistant Quick Trigger */}
      {activeTab !== 'assistant' && (
        <aside aria-label="Bantuan Asisten AI Tani" className="fixed bottom-5 right-5 z-30">
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
            title="Konsultasikan Jadwal & Langkah Perawatan Tanaman dengan Asisten AI"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
            </div>
            <span className="font-extrabold text-xs sm:text-sm tracking-tight hidden sm:inline">
              Tanya Asisten AI
            </span>
          </button>
        </aside>
      )}

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
        onConnectionChanged={handleConnectionChanged}
      />

    </div>
  );
}
