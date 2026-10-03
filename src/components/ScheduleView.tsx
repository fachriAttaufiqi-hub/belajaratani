import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck2, 
  Search, 
  Filter, 
  Check, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Sparkles, 
  Trash2, 
  CheckCircle, 
  MapPin, 
  Info,
  Calendar,
  Layers,
  ChevronRight,
  Droplets
} from 'lucide-react';
import { Planting, TaskCategory, TaskItem } from '../types';
import { formatDate, generateUUID } from '../lib/storage';
import confetti from 'canvas-confetti';

interface ScheduleViewProps {
  plantings: Planting[];
  tasks: TaskItem[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  onToggleTask: (taskId: string, isCompleted: boolean, notes?: string) => void;
  onAddTask: (task: TaskItem) => Promise<{ success: boolean; syncedToSupabase: boolean; error?: string }>;
  onDeleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  onOpenNewPlanting: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  plantings,
  tasks,
  selectedPlotId,
  onSelectPlot,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onOpenNewPlanting
}) => {
  const todayStr = formatDate(new Date());

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'today' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  
  // Custom Task Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [customPlotId, setCustomPlotId] = useState<string>(plantings[0]?.id || '');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<TaskCategory>('penyiraman');
  const [customHst, setCustomHst] = useState<number>(10);
  const [customDueDate, setCustomDueDate] = useState<string>(todayStr);
  const [customDosage, setCustomDosage] = useState<string>('');
  const [customDesc, setCustomDesc] = useState<string>('');
  const [customPriority, setCustomPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Plot match
      if (selectedPlotId !== 'all' && task.planting_id !== selectedPlotId) {
        return false;
      }

      // Status match
      if (statusFilter === 'pending' && task.is_completed) return false;
      if (statusFilter === 'completed' && !task.is_completed) return false;
      if (statusFilter === 'today') {
        const isTodayOrOverdue = task.due_date <= todayStr && !task.is_completed;
        if (!isTodayOrOverdue) return false;
      }

      // Category match
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(q);
        const descMatch = (task.description || '').toLowerCase().includes(q);
        const dosageMatch = (task.dosage || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !dosageMatch) return false;
      }

      return true;
    }).sort((a, b) => a.due_date.localeCompare(b.due_date) || a.hst - b.hst);
  }, [tasks, selectedPlotId, statusFilter, categoryFilter, searchQuery, todayStr]);

  const handleToggle = (taskId: string, current: boolean) => {
    onToggleTask(taskId, !current);
    if (!current) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#10b981', '#059669', '#34d399', '#f59e0b']
      });
    }
  };

  const handleCreateCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPlotId || !customTitle.trim()) return;

    const newTask: TaskItem = {
      id: generateUUID(), // Valid UUID!
      planting_id: customPlotId,
      title: customTitle.trim(),
      category: customCategory,
      hst: Number(customHst) || 0,
      due_date: customDueDate,
      dosage: customDosage.trim() || undefined,
      description: customDesc.trim() || undefined,
      priority: customPriority,
      is_completed: false
    };

    await onAddTask(newTask);
    setIsAddModalOpen(false);
    setCustomTitle('');
    setCustomDosage('');
    setCustomDesc('');
  };

  const handleQuickAddWatering = () => {
    setCustomCategory('penyiraman');
    setCustomTitle('Penyiraman Rutin Lahan & Cek Saluran Irigasi');
    setCustomDesc('Siram tanah sela bedengan secukupnya, pastikan tidak ada genangan berlebih di pangkal batang.');
    setCustomPriority('medium');
    setIsAddModalOpen(true);
  };

  // Stats for the active view
  const completedCount = tasks.filter(t => (selectedPlotId === 'all' || t.planting_id === selectedPlotId) && t.is_completed).length;
  const totalCount = tasks.filter(t => selectedPlotId === 'all' || t.planting_id === selectedPlotId).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              Jadwal & Checklist Kegiatan Bertani
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {filteredTasks.length} Agenda
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Pusat kendali SOP harian: Pemupukan berimbang, penyiangan, pemantauan hama (HST), dan panen raya.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleQuickAddWatering}
            className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Droplets className="w-4 h-4 text-blue-600" />
            <span>+ Jadwal Siram Air</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Tambah Tugas Khusus
          </button>
        </div>
      </div>

      {/* Progress Bar of Completion */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-stone-700">
          <span className="flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
            Kemajuan Pekerjaan Lahan: {completedCount} dari {totalCount} Tugas Selesai
          </span>
          <span className="text-emerald-700 font-extrabold">{progressPercent}% Tuntas</span>
        </div>
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
          <div
            className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari tugas, nama pupuk (misal: NPK, Urea), hama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Status buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'today'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hari Ini / Tertunda
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Belum Selesai
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Selesai
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Semua Kategori' },
            { id: 'pemupukan', label: '🌱 Pemupukan' },
            { id: 'penyiangan', label: '🌿 Penyiangan Gulma' },
            { id: 'pengendalian_hama', label: '🛡️ Pengendalian Hama' },
            { id: 'penyiraman', label: '💧 Irigasi & Air' },
            { id: 'perawatan', label: '✂️ Perawatan & Pangkas' },
            { id: 'panen', label: '🌾 Panen' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Checklist Timeline */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-dashed border-stone-300 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-3xl">
            📋
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-800">Tidak ada tugas yang sesuai filter</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Coba sesuaikan filter status, kategori, atau pencarian Anda.
            </p>
          </div>
          {plantings.length === 0 && (
            <button
              onClick={onOpenNewPlanting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4" /> Tambah Lahan Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const planting = plantings.find(p => p.id === task.planting_id);
            const isOverdue = task.due_date < todayStr && !task.is_completed;
            const isToday = task.due_date === todayStr && !task.is_completed;

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition group ${
                  task.is_completed
                    ? 'bg-stone-50/70 border-stone-200 opacity-80'
                    : isOverdue
                    ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-200'
                    : isToday
                    ? 'bg-amber-50/40 border-amber-200 ring-1 ring-amber-200'
                    : 'bg-white border-stone-200 hover:border-emerald-300 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  
                  {/* Big Checkbox */}
                  <button
                    onClick={() => handleToggle(task.id, task.is_completed)}
                    className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center transition border shrink-0 cursor-pointer ${
                      task.is_completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-stone-300 hover:border-emerald-600 hover:scale-105'
                    }`}
                    title={task.is_completed ? 'Tandai Belum Selesai' : 'Tandai Sudah Selesai'}
                  >
                    {task.is_completed && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* HST Badge */}
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-stone-900 text-white">
                        {task.hst} HST
                      </span>

                      {/* Category Badge */}
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        task.category === 'pemupukan' ? 'bg-amber-100 text-amber-800' :
                        task.category === 'pengendalian_hama' ? 'bg-rose-100 text-rose-800' :
                        task.category === 'penyiangan' ? 'bg-emerald-100 text-emerald-800' :
                        task.category === 'penyiraman' ? 'bg-blue-100 text-blue-800' :
                        task.category === 'panen' ? 'bg-teal-100 text-teal-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {task.category === 'pengendalian_hama' ? 'Hama & Penyakit' : task.category.replace('_', ' ')}
                      </span>

                      {/* Due Date Indicator */}
                      <span className="text-xs font-semibold text-stone-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {task.due_date}
                      </span>

                      {/* Overdue / Today alert */}
                      {isOverdue && (
                        <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Terlewat
                        </span>
                      )}
                      {isToday && (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Agenda Hari Ini
                        </span>
                      )}

                      {/* Plot info */}
                      {planting && (
                        <span className="text-xs font-medium text-stone-500 ml-auto flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {planting.plot_name} ({planting.crop_name})
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className={`text-sm sm:text-base font-bold ${
                      task.is_completed ? 'line-through text-stone-500' : 'text-stone-900'
                    }`}>
                      {task.title}
                    </h3>

                    {/* Dosage recommendation box */}
                    {task.dosage && (
                      <div className="mt-2 text-xs font-semibold text-emerald-900 bg-emerald-50/90 border border-emerald-200/80 p-2.5 rounded-xl inline-block max-w-full">
                        🌿 <span className="font-bold">Anjuran Takaran:</span> {task.dosage}
                      </div>
                    )}

                    {/* Description */}
                    {task.description && (
                      <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Completion Info */}
                    {task.is_completed && task.completed_at && (
                      <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Diselesaikan pada: {task.completed_at.split('T')[0]} {task.completion_notes ? `— "${task.completion_notes}"` : ''}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center">
                    <button
                      onClick={() => setTaskToDelete(task)}
                      title="Hapus Tugas"
                      className="p-1.5 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Delete Task */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-stone-900">
                Hapus Jadwal Kegiatan Ini?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Tugas <strong>"{taskToDelete.title}"</strong> ({taskToDelete.hst} HST, {taskToDelete.due_date}) akan dihapus permanen dari Supabase dan jadwal lahan.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = taskToDelete.id;
                  setTaskToDelete(null);
                  await onDeleteTask(id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Tugas Kustom */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className="bg-stone-900 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Tambah Tugas Khusus Lahan</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomTask} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Pilih Lahan / Plot</label>
                <select
                  value={customPlotId}
                  onChange={(e) => setCustomPlotId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                  required
                >
                  {plantings.map(p => (
                    <option key={p.id} value={p.id}>{p.plot_name} — {p.crop_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Judul Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Perbaikan Pematang, Beli Pestisida Tambahan"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Kategori</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as TaskCategory)}
                    className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                  >
                    <option value="pemupukan">Pemupukan</option>
                    <option value="penyiangan">Penyiangan</option>
                    <option value="pengendalian_hama">Pengendalian Hama</option>
                    <option value="penyiraman">Penyiraman / Air</option>
                    <option value="perawatan">Perawatan Lahan</option>
                    <option value="panen">Panen</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Umur Tanam (HST)</label>
                  <input
                    type="number"
                    value={customHst}
                    onChange={(e) => setCustomHst(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tanggal Tenggat</label>
                <input
                  type="date"
                  required
                  value={customDueDate}
                  onChange={(e) => setCustomDueDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Takaran / Dosis (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: 50 kg Urea / ha, atau 2 ml / liter"
                  value={customDosage}
                  onChange={(e) => setCustomDosage(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Deskripsi & Catatan Petunjuk</label>
                <textarea
                  rows={2}
                  placeholder="Instruksi pelaksanaan pekerjaan di lapangan..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                >
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
