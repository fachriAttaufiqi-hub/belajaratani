import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ScheduleView } from './components/ScheduleView';
import { FarmLogView } from './components/FarmLogView';
import { GuideView } from './components/GuideView';
import { NewPlantingModal } from './components/NewPlantingModal';
import { FertilizerCalcModal } from './components/FertilizerCalcModal';
import { SupabaseModal } from './components/SupabaseModal';
import { FarmDB } from './lib/storage';
import { getSavedSupabaseConfig } from './lib/supabase';
import { ActivityLog, ExpenseRecord, Planting, TaskItem } from './types';

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
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [appToast, setAppToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showAppToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setAppToast({ message, type });
    setTimeout(() => setAppToast(null), 4000);
  };

  // Load all data
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
      console.error('Gagal memuat data pertanian:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle adding new planting + auto generated schedule
  const handleSavePlanting = async (planting: Planting) => {
    const { planting: savedPlanting, tasks: newTasks, syncedToSupabase, error } = await FarmDB.addPlanting(planting);
    setPlantings(prev => [savedPlanting, ...prev]);
    setTasks(prev => [...newTasks, ...prev]);
    setSelectedPlotId(savedPlanting.id);
    setActiveTab('schedule'); // Switch to schedule view to see the generated timeline immediately!

    if (syncedToSupabase) {
      showAppToast(`Lahan "${savedPlanting.plot_name}" & ${newTasks.length} jadwal otomatis berhasil disimpan ke Supabase!`, 'success');
    } else if (error) {
      showAppToast(`Lahan disimpan di lokal. Supabase: ${error}`, 'warning');
    } else {
      showAppToast(`Lahan "${savedPlanting.plot_name}" & ${newTasks.length} jadwal otomatis berhasil dibuat!`, 'success');
    }
  };

  // Handle deleting planting
  const handleDeletePlanting = async (plotId: string) => {
    if (window.confirm('Yakin ingin menghapus plot lahan ini beserta seluruh jadwal dan catatannya?')) {
      await FarmDB.deletePlanting(plotId);
      setPlantings(prev => prev.filter(p => p.id !== plotId));
      setTasks(prev => prev.filter(t => t.planting_id !== plotId));
      setLogs(prev => prev.filter(l => l.planting_id !== plotId));
      setExpenses(prev => prev.filter(e => e.planting_id !== plotId));
      if (selectedPlotId === plotId) {
        setSelectedPlotId('all');
      }
    }
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

  // Guide: quick start planting with specific crop
  const handleStartPlantingWithCrop = (cropId: string) => {
    setIsNewPlantingOpen(true);
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
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
        
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
