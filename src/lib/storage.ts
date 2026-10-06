import { ActivityLog, ExpenseRecord, Planting, TaskItem } from '../types';
import { DEFAULT_CROPS } from '../data/defaultCrops';
import { getSupabaseClient } from './supabase';

const STORAGE_KEYS = {
  PLANTINGS: 'taniguide_plantings_v3',
  TASKS: 'taniguide_tasks_v3',
  LOGS: 'taniguide_logs_v3',
  EXPENSES: 'taniguide_expenses_v3',
  INITIALIZED: 'taniguide_initialized_v3'
};

// Clean legacy demo/mock data from previous versions if present
(function cleanLegacyStorage() {
  try {
    const legacyKeys = [
      'taniguide_plantings_v2',
      'taniguide_tasks_v2',
      'taniguide_logs_v2',
      'taniguide_expenses_v2',
      'taniguide_initialized_v2',
      'taniguide_plantings',
      'taniguide_tasks',
      'taniguide_logs',
      'taniguide_expenses',
      'taniguide_initialized'
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  } catch {
    // ignore
  }
})();

// Standard compliant UUID generator
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback if in insecure context
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function calculateHST(plantingDateStr: string): number {
  const pDate = new Date(plantingDateStr);
  const now = new Date();
  pDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - pDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Generate automatic tasks for a planting with UUIDs
export function generateTasksForPlanting(planting: Planting): TaskItem[] {
  const crop = DEFAULT_CROPS.find(c => c.id === planting.crop_id);
  if (!crop) return [];

  return crop.standardStages.map((stage) => {
    const dueDate = addDays(planting.planting_date, stage.hst);
    const currentHst = calculateHST(planting.planting_date);
    const isPast = currentHst >= stage.hst;

    return {
      id: generateUUID(),
      planting_id: planting.id,
      title: stage.title,
      category: stage.category,
      hst: stage.hst,
      due_date: dueDate,
      dosage: stage.dosageRecommendation,
      description: stage.description,
      priority: stage.priority,
      is_completed: isPast && stage.hst < currentHst - 3,
      completed_at: isPast && stage.hst < currentHst - 3 ? dueDate : null,
      completion_notes: isPast && stage.hst < currentHst - 3 ? 'Selesai sesuai rekomendasi SOP' : ''
    };
  });
}

export function initLocalStorageIfEmpty() {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!initialized) {
    localStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

// Data Access Layer with Supabase + Local Storage Dual Layer
export async function ensureCropsInSupabase(supabase: any) {
  try {
    const cropsPayload = DEFAULT_CROPS.map(c => ({
      id: c.id,
      name: c.name,
      latin_name: c.latinName,
      category: c.category,
      variety_examples: c.varietyExamples,
      harvest_days_min: c.harvestDaysMin,
      harvest_days_max: c.harvestDaysMax,
      icon: c.icon,
      description: c.description
    }));
    const { error } = await supabase.from('crops').upsert(cropsPayload, { onConflict: 'id' });
    if (error) {
      console.warn('Gagal upsert crops ke Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Auto seed crops in Supabase warning:', err);
  }
}

export async function ensurePlantingExistsInSupabase(supabase: any, plantingId: string): Promise<boolean> {
  if (!supabase || !plantingId) return false;
  try {
    // 1. Pastikan seluruh master komoditas ada di tabel crops
    await ensureCropsInSupabase(supabase);

    // 2. Cek apakah planting sudah ada di database Supabase
    const { data: pCheck, error: checkErr } = await supabase
      .from('plantings')
      .select('id')
      .eq('id', plantingId)
      .maybeSingle();

    if (!checkErr && pCheck && pCheck.id) {
      return true;
    }

    // 3. Ambil data planting dari localStorage
    initLocalStorageIfEmpty();
    const rawPlantings = localStorage.getItem(STORAGE_KEYS.PLANTINGS);
    const plantings: Planting[] = rawPlantings ? JSON.parse(rawPlantings) : [];
    let currentP = plantings.find(p => p.id === plantingId);

    if (!currentP) {
      return false;
    }

    const plantingPayload = {
      id: currentP.id,
      crop_id: currentP.crop_id || 'jagung',
      crop_name: currentP.crop_name || 'Tanaman',
      variety: currentP.variety || 'Lokal',
      plot_name: currentP.plot_name || 'Lahan',
      area_sqm: Number(currentP.area_sqm) || 1000,
      planting_date: currentP.planting_date || formatDate(new Date()),
      estimated_harvest_date: currentP.estimated_harvest_date || addDays(formatDate(new Date()), 90),
      status: currentP.status || 'active',
      notes: currentP.notes || ''
    };

    const { error: upsertErr } = await supabase.from('plantings').upsert([plantingPayload], { onConflict: 'id' });
    if (upsertErr) {
      console.warn('Gagal upsert planting di Supabase:', upsertErr.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception di ensurePlantingExistsInSupabase:', err);
    return false;
  }
}

export const FarmDB = {
  // --- Plantings ---
  async getPlantings(): Promise<Planting[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('plantings').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          localStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify(data));
          return data;
        } else if (error) {
          console.warn('Supabase query error (plantings):', error.message);
        }
      } catch (err) {
        console.warn('Fallback ke local storage untuk plantings:', err);
      }
    }
    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.PLANTINGS);
    return raw ? JSON.parse(raw) : [];
  },

  async addPlanting(planting: Planting): Promise<{ planting: Planting; tasks: TaskItem[]; syncedToSupabase: boolean; error?: string }> {
    const autoTasks = generateTasksForPlanting(planting);

    // 1. Simpan di Local Storage
    initLocalStorageIfEmpty();
    const rawPlantings = localStorage.getItem(STORAGE_KEYS.PLANTINGS);
    const plantings: Planting[] = rawPlantings ? JSON.parse(rawPlantings) : [];
    plantings.unshift(planting);
    localStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify(plantings));

    const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks: TaskItem[] = rawTasks ? JSON.parse(rawTasks) : [];
    const updatedTasks = [...autoTasks, ...tasks];
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));

    // 2. Simpan ke Supabase jika terhubung
    let synced = false;
    let errMsg = undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Pastikan komoditas sudah ada di tabel public.crops agar foreign key tidak error
        await ensureCropsInSupabase(supabase);

        // Bersihkan objek untuk kompatibilitas skema Supabase
        const plantingPayload = {
          id: planting.id,
          crop_id: planting.crop_id,
          crop_name: planting.crop_name,
          variety: planting.variety,
          plot_name: planting.plot_name,
          area_sqm: planting.area_sqm,
          planting_date: planting.planting_date,
          estimated_harvest_date: planting.estimated_harvest_date,
          status: planting.status || 'active',
          notes: planting.notes || ''
        };

        const { error: pErr } = await supabase.from('plantings').insert([plantingPayload]);
        if (pErr) {
          console.error('Gagal simpan planting ke Supabase:', pErr);
          errMsg = pErr.message;
        } else {
          synced = true;
          if (autoTasks.length > 0) {
            const taskPayloads = autoTasks.map(t => ({
              id: t.id,
              planting_id: t.planting_id,
              title: t.title,
              category: t.category,
              hst: t.hst,
              due_date: t.due_date,
              dosage: t.dosage || null,
              description: t.description || null,
              priority: t.priority || 'medium',
              is_completed: t.is_completed || false
            }));
            const { error: tErr } = await supabase.from('tasks').insert(taskPayloads);
            if (tErr) console.warn('Gagal simpan tasks ke Supabase:', tErr.message);
          }
        }
      } catch (err: any) {
        console.error('Exception saat sync planting ke Supabase:', err);
        errMsg = err?.message || 'Gagal koneksi ke server Supabase';
      }
    }

    return { planting, tasks: autoTasks, syncedToSupabase: synced, error: errMsg };
  },

  async deletePlanting(plantingId: string): Promise<{ success: boolean; error?: string }> {
    initLocalStorageIfEmpty();
    const rawPlantings = localStorage.getItem(STORAGE_KEYS.PLANTINGS);
    if (rawPlantings) {
      const filtered = JSON.parse(rawPlantings).filter((p: Planting) => p.id !== plantingId);
      localStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify(filtered));
    }

    const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (rawTasks) {
      const filtered = JSON.parse(rawTasks).filter((t: TaskItem) => t.planting_id !== plantingId);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    }

    const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (rawLogs) {
      const filtered = JSON.parse(rawLogs).filter((l: ActivityLog) => l.planting_id !== plantingId);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(filtered));
    }

    const rawExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (rawExpenses) {
      const filtered = JSON.parse(rawExpenses).filter((e: ExpenseRecord) => e.planting_id !== plantingId);
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('plantings').delete().eq('id', plantingId);
        if (error) {
          console.error('Gagal delete planting di Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.error('Gagal delete planting di Supabase:', err);
        return { success: false, error: err?.message };
      }
    }

    return { success: true };
  },

  // --- Tasks ---
  async getTasks(plantingId?: string): Promise<TaskItem[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('tasks').select('*').order('due_date', { ascending: true });
        if (plantingId && plantingId !== 'all') {
          query = query.eq('planting_id', plantingId);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          if (!plantingId || plantingId === 'all') {
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data));
          }
          return data;
        }
      } catch (err) {
        console.warn('Fallback tasks ke lokal:', err);
      }
    }

    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks: TaskItem[] = raw ? JSON.parse(raw) : [];
    if (plantingId && plantingId !== 'all') {
      return tasks.filter(t => t.planting_id === plantingId);
    }
    return tasks;
  },

  async toggleTaskCompletion(taskId: string, isCompleted: boolean, notes?: string): Promise<TaskItem | null> {
    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return null;

    const tasks: TaskItem[] = JSON.parse(raw);
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;

    const completedAt = isCompleted ? new Date().toISOString() : null;
    tasks[idx] = {
      ...tasks[idx],
      is_completed: isCompleted,
      completed_at: completedAt,
      completion_notes: notes !== undefined ? notes : tasks[idx].completion_notes
    };

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('tasks')
          .update({
            is_completed: isCompleted,
            completed_at: completedAt,
            completion_notes: tasks[idx].completion_notes
          })
          .eq('id', taskId);
      } catch (err) {
        console.warn('Gagal update task di Supabase:', err);
      }
    }

    return tasks[idx];
  },

  async addTask(task: TaskItem): Promise<{ task: TaskItem; syncedToSupabase: boolean; error?: string }> {
    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks: TaskItem[] = raw ? JSON.parse(raw) : [];
    tasks.unshift(task);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    let synced = false;
    let errMsg = undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Pastikan lahan terdaftar di Supabase sebelum insert task
        await ensurePlantingExistsInSupabase(supabase, task.planting_id);

        const payload = {
          id: task.id,
          planting_id: task.planting_id,
          title: task.title,
          category: task.category,
          hst: task.hst,
          due_date: task.due_date,
          dosage: task.dosage || null,
          description: task.description || null,
          priority: task.priority || 'medium',
          is_completed: task.is_completed || false
        };
        const { error } = await supabase.from('tasks').insert([payload]);
        if (error) {
          console.error('Gagal insert task di Supabase:', error);
          errMsg = error.message;
        } else {
          synced = true;
        }
      } catch (err: any) {
        errMsg = err?.message;
      }
    }
    return { task, syncedToSupabase: synced, error: errMsg };
  },

  async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) {
      const tasks: TaskItem[] = JSON.parse(raw);
      const filtered = tasks.filter(t => t.id !== taskId);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) return { success: false, error: error.message };
      } catch (err: any) {
        return { success: false, error: err?.message };
      }
    }
    return { success: true };
  },

  // --- Logs (Catatan Digital / Hama / Cuaca) ---
  async getLogs(plantingId?: string): Promise<ActivityLog[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('activity_logs').select('*').order('date', { ascending: false });
        if (plantingId && plantingId !== 'all') {
          query = query.eq('planting_id', plantingId);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          if (!plantingId || plantingId === 'all') {
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data));
          }
          return data;
        }
      } catch (err) {
        console.warn('Fallback logs ke lokal:', err);
      }
    }

    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    const logs: ActivityLog[] = raw ? JSON.parse(raw) : [];
    if (plantingId && plantingId !== 'all') {
      return logs.filter(l => l.planting_id === plantingId);
    }
    return logs;
  },

  async addLog(log: ActivityLog): Promise<{ log: ActivityLog; syncedToSupabase: boolean; error?: string }> {
    // 1. Simpan di local storage
    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    const logs: ActivityLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));

    // 2. Simpan di Supabase
    let synced = false;
    let errMsg = undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Pastikan plot/lahan terdaftar di Supabase sebelum insert log
        await ensurePlantingExistsInSupabase(supabase, log.planting_id);

        const logPayload = {
          id: log.id,
          planting_id: log.planting_id,
          date: log.date,
          type: log.type,
          title: log.title,
          notes: log.notes,
          weather_condition: log.weather_condition || 'cerah',
          cost_amount: log.cost_amount || 0,
          harvest_yield_kg: log.harvest_yield_kg || 0
        };

        const { error } = await supabase.from('activity_logs').insert([logPayload]);
        if (error) {
          console.error('Supabase error saat insert activity_logs:', error);
          errMsg = error.message;
        } else {
          synced = true;
        }
      } catch (err: any) {
        console.error('Exception saat kirim log ke Supabase:', err);
        errMsg = err?.message || 'Gagal koneksi ke Supabase';
      }
    }

    return { log, syncedToSupabase: synced, error: errMsg };
  },

  async deleteLog(logId: string): Promise<{ success: boolean; error?: string }> {
    // 1. Hapus dari local storage
    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (raw) {
      const logs: ActivityLog[] = JSON.parse(raw);
      const filtered = logs.filter(l => l.id !== logId);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(filtered));
    }

    // 2. Hapus dari Supabase
    let errMsg = undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('activity_logs').delete().eq('id', logId);
        if (error) {
          console.error('Gagal hapus log di Supabase:', error);
          errMsg = error.message;
          return { success: false, error: errMsg };
        }
      } catch (err: any) {
        console.error('Exception saat delete log Supabase:', err);
        return { success: false, error: err?.message };
      }
    }

    return { success: true };
  },

  // --- Expenses (Buku Kas & Biaya Operasional) ---
  async getExpenses(plantingId?: string): Promise<ExpenseRecord[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('expenses').select('*').order('date', { ascending: false });
        if (plantingId && plantingId !== 'all') {
          query = query.eq('planting_id', plantingId);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          if (!plantingId || plantingId === 'all') {
            localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data));
          }
          return data;
        }
      } catch (err) {
        console.warn('Fallback expenses ke lokal:', err);
      }
    }

    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const expenses: ExpenseRecord[] = raw ? JSON.parse(raw) : [];
    if (plantingId && plantingId !== 'all') {
      return expenses.filter(e => e.planting_id === plantingId);
    }
    return expenses;
  },

  async addExpense(expense: ExpenseRecord): Promise<{ expense: ExpenseRecord; syncedToSupabase: boolean; error?: string }> {
    // 1. Simpan di local storage
    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const expenses: ExpenseRecord[] = raw ? JSON.parse(raw) : [];
    expenses.unshift(expense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    // 2. Simpan di Supabase
    let synced = false;
    let errMsg = undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Pastikan plot/lahan terdaftar di Supabase sebelum insert expense
        await ensurePlantingExistsInSupabase(supabase, expense.planting_id);

        const expensePayload = {
          id: expense.id,
          planting_id: expense.planting_id,
          date: expense.date,
          category: expense.category,
          item_name: expense.item_name,
          amount: expense.amount,
          notes: expense.notes || ''
        };

        const { error } = await supabase.from('expenses').insert([expensePayload]);
        if (error) {
          console.error('Supabase error saat insert expenses:', error);
          errMsg = error.message;
        } else {
          synced = true;
        }
      } catch (err: any) {
        console.error('Exception saat insert expense Supabase:', err);
        errMsg = err?.message || 'Gagal koneksi ke Supabase';
      }
    }

    return { expense, syncedToSupabase: synced, error: errMsg };
  },

  async deleteExpense(expenseId: string): Promise<{ success: boolean; error?: string }> {
    // 1. Hapus dari local storage
    initLocalStorageIfEmpty();
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (raw) {
      const expenses: ExpenseRecord[] = JSON.parse(raw);
      const filtered = expenses.filter(e => e.id !== expenseId);
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
    }

    // 2. Hapus dari Supabase
    let errMsg = undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
        if (error) {
          console.error('Gagal hapus expense di Supabase:', error);
          errMsg = error.message;
          return { success: false, error: errMsg };
        }
      } catch (err: any) {
        console.error('Exception saat delete expense Supabase:', err);
        return { success: false, error: err?.message };
      }
    }

    return { success: true };
  },

  // Batch sync all local data to Supabase
  async syncAllLocalToSupabase(): Promise<{ success: boolean; message: string; count: { plantings: number; tasks: number; logs: number; expenses: number } }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, message: 'Supabase belum dikonfigurasi. Masukkan URL dan Anon Key terlebih dahulu.', count: { plantings: 0, tasks: 0, logs: 0, expenses: 0 } };
    }

    try {
      initLocalStorageIfEmpty();
      const rawPlantings = localStorage.getItem(STORAGE_KEYS.PLANTINGS);
      const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      const rawExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);

      const plantings: Planting[] = rawPlantings ? JSON.parse(rawPlantings) : [];
      const tasks: TaskItem[] = rawTasks ? JSON.parse(rawTasks) : [];
      const logs: ActivityLog[] = rawLogs ? JSON.parse(rawLogs) : [];
      const expenses: ExpenseRecord[] = rawExpenses ? JSON.parse(rawExpenses) : [];

      // 0. Pastikan katalog crops diisi terlebih dahulu untuk mencegah pelanggaran Foreign Key
      await ensureCropsInSupabase(supabase);

      // 1. Sync Plantings
      if (plantings.length > 0) {
        const pPayloads = plantings.map(p => ({
          id: p.id,
          crop_id: p.crop_id,
          crop_name: p.crop_name,
          variety: p.variety,
          plot_name: p.plot_name,
          area_sqm: p.area_sqm,
          planting_date: p.planting_date,
          estimated_harvest_date: p.estimated_harvest_date,
          status: p.status || 'active',
          notes: p.notes || ''
        }));
        const { error: pErr } = await supabase.from('plantings').upsert(pPayloads, { onConflict: 'id' });
        if (pErr) throw new Error(`Gagal sync plantings: ${pErr.message}`);
      }

      // 2. Sync Tasks
      if (tasks.length > 0) {
        const tPayloads = tasks.map(t => ({
          id: t.id,
          planting_id: t.planting_id,
          title: t.title,
          category: t.category,
          hst: t.hst,
          due_date: t.due_date,
          dosage: t.dosage || null,
          description: t.description || null,
          priority: t.priority || 'medium',
          is_completed: t.is_completed || false,
          completed_at: t.completed_at || null,
          completion_notes: t.completion_notes || null
        }));
        const { error: tErr } = await supabase.from('tasks').upsert(tPayloads, { onConflict: 'id' });
        if (tErr) throw new Error(`Gagal sync tasks: ${tErr.message}`);
      }

      // 3. Sync Logs
      if (logs.length > 0) {
        const lPayloads = logs.map(l => ({
          id: l.id,
          planting_id: l.planting_id,
          date: l.date,
          type: l.type,
          title: l.title,
          notes: l.notes,
          weather_condition: l.weather_condition || 'cerah',
          cost_amount: l.cost_amount || 0,
          harvest_yield_kg: l.harvest_yield_kg || 0
        }));
        const { error: lErr } = await supabase.from('activity_logs').upsert(lPayloads, { onConflict: 'id' });
        if (lErr) throw new Error(`Gagal sync logs: ${lErr.message}`);
      }

      // 4. Sync Expenses
      if (expenses.length > 0) {
        const ePayloads = expenses.map(e => ({
          id: e.id,
          planting_id: e.planting_id,
          date: e.date,
          category: e.category,
          item_name: e.item_name,
          amount: e.amount,
          notes: e.notes || ''
        }));
        const { error: eErr } = await supabase.from('expenses').upsert(ePayloads, { onConflict: 'id' });
        if (eErr) throw new Error(`Gagal sync expenses: ${eErr.message}`);
      }

      return {
        success: true,
        message: 'Seluruh data lahan, jadwal, catatan, dan biaya operasional berhasil disinkronisasikan ke Supabase!',
        count: {
          plantings: plantings.length,
          tasks: tasks.length,
          logs: logs.length,
          expenses: expenses.length
        }
      };
    } catch (err: any) {
      console.error('Error batch sync:', err);
      return {
        success: false,
        message: err?.message || 'Terjadi kesalahan saat sinkronisasi ke Supabase',
        count: { plantings: 0, tasks: 0, logs: 0, expenses: 0 }
      };
    }
  },

  async clearAllData(): Promise<{ success: boolean; error?: string }> {
    localStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('plantings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err: any) {
        console.warn('Gagal bersihkan Supabase:', err);
        return { success: false, error: err?.message };
      }
    }
    return { success: true };
  },

  async exportAllData(): Promise<string> {
    initLocalStorageIfEmpty();
    const plantings = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANTINGS) || '[]');
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');

    const backup = {
      app: 'TaniGuide',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      plantings,
      tasks,
      logs,
      expenses
    };
    return JSON.stringify(backup, null, 2);
  },

  async importAllData(jsonString: string): Promise<{ success: boolean; message: string; count?: any }> {
    try {
      const data = JSON.parse(jsonString);
      if (!data || (!Array.isArray(data.plantings) && !Array.isArray(data.tasks))) {
        return { success: false, message: 'Format data cadangan tidak dikenali.' };
      }

      const plantings: Planting[] = Array.isArray(data.plantings) ? data.plantings : [];
      const tasks: TaskItem[] = Array.isArray(data.tasks) ? data.tasks : [];
      const logs: ActivityLog[] = Array.isArray(data.logs) ? data.logs : [];
      const expenses: ExpenseRecord[] = Array.isArray(data.expenses) ? data.expenses : [];

      localStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify(plantings));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

      // Jika Supabase terhubung, otomatis unggah ke cloud
      const supabase = getSupabaseClient();
      if (supabase) {
        await FarmDB.syncAllLocalToSupabase();
      }

      return {
        success: true,
        message: `Berhasil mengimpor ${plantings.length} lahan, ${tasks.length} tugas, ${logs.length} catatan, dan ${expenses.length} biaya!`,
        count: {
          plantings: plantings.length,
          tasks: tasks.length,
          logs: logs.length,
          expenses: expenses.length
        }
      };
    } catch (err: any) {
      return { success: false, message: 'Gagal mengimpor: ' + (err?.message || 'Format JSON rusak') };
    }
  }
};
