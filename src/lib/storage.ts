import { ActivityLog, ExpenseRecord, Planting, TaskItem } from '../types';
import { DEFAULT_CROPS } from '../data/defaultCrops';
import { getSupabaseClient, broadcastRealtimeChange } from './supabase';
import { idbGet, idbSet, requestPersistentStorage } from './indexedDb';

const STORAGE_KEYS = {
  PLANTINGS: 'taniguide_plantings_v4',
  TASKS: 'taniguide_tasks_v4',
  LOGS: 'taniguide_logs_v4',
  EXPENSES: 'taniguide_expenses_v4'
};

// Clean legacy demo/mock data from previous versions
export function purgeLegacyMockData() {
  if (typeof window === 'undefined') return;
  try {
    const legacyKeys = [
      'taniguide_plantings_v3',
      'taniguide_tasks_v3',
      'taniguide_logs_v3',
      'taniguide_expenses_v3',
      'taniguide_initialized_v3',
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
    legacyKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });

    // Check v4 storage for mock plot names and remove if present
    const rawPlantings = localStorage.getItem(STORAGE_KEYS.PLANTINGS);
    if (rawPlantings) {
      const parsed = JSON.parse(rawPlantings);
      if (Array.isArray(parsed)) {
        const hasMock = parsed.some((p: any) => 
          p.plot_name === 'Lahan Barat (Petak A)' ||
          p.plot_name === 'Kebun Mulsa Blok B (500 Pohon)' ||
          p.plot_name === 'Sawah Irigasi Desa C (0.5 Ha)'
        );
        if (hasMock) {
          localStorage.removeItem(STORAGE_KEYS.PLANTINGS);
          localStorage.removeItem(STORAGE_KEYS.TASKS);
          localStorage.removeItem(STORAGE_KEYS.LOGS);
          localStorage.removeItem(STORAGE_KEYS.EXPENSES);
        }
      }
    }
  } catch {
    // ignore
  }
}

// Run purge on module load
purgeLegacyMockData();

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

// Generate automatic tasks for a planting
export function generateTasksForPlanting(planting: Planting): TaskItem[] {
  // If matched in templates, use standard stages
  const crop = DEFAULT_CROPS.find(c => c.id === planting.crop_id);
  if (crop && Array.isArray(crop.standardStages) && crop.standardStages.length > 0) {
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

  // Generic fallback stages for custom user crops
  const pDate = planting.planting_date;
  const currentHst = calculateHST(pDate);

  const genericStages = [
    { title: 'Tanam & Pemupukan Dasar Organik', hst: 0, category: 'perawatan' as const, desc: 'Tanam benih/bibit dan berikan pupuk dasar' },
    { title: 'Pemupukan Susulan I (Fase Awal Vegetatif)', hst: 14, category: 'pemupukan' as const, desc: 'Aplikasi pupuk NPK untuk pertumbuhan tunas dan daun' },
    { title: 'Penyiangan Gulma & Pembumbunan Tanah', hst: 28, category: 'penyiangan' as const, desc: 'Bersihkan rumput liar dan gemburkan tanah di sekitar perakaran' },
    { title: 'Pemupukan Susulan II (Fase Pembungaan / Generatif)', hst: 42, category: 'pemupukan' as const, desc: 'Aplikasi pupuk NPK dan Kalium untuk pembentukan bunga dan buah' },
    { title: 'Monitoring & Pengendalian Hama / Penyakit', hst: 55, category: 'pengendalian_hama' as const, desc: 'Periksa daun dan buah dari serangan hama atau jamur' },
    { title: 'Panen Raya Hasil Budidaya', hst: 90, category: 'panen' as const, desc: 'Panen hasil tanaman yang telah masak fisiologis prima' }
  ];

  return genericStages.map(s => {
    const dueDate = addDays(pDate, s.hst);
    const isPast = currentHst >= s.hst;
    return {
      id: generateUUID(),
      planting_id: planting.id,
      title: s.title,
      category: s.category,
      hst: s.hst,
      due_date: dueDate,
      dosage: 'Sesuai anjuran budidaya',
      description: s.desc,
      priority: 'high' as const,
      is_completed: isPast && s.hst < currentHst - 3,
      completed_at: isPast && s.hst < currentHst - 3 ? dueDate : null,
      completion_notes: isPast && s.hst < currentHst - 3 ? 'Selesai' : ''
    };
  });
}

// Cached in-memory promise for fetch('/api/data')
let serverDataCache: any = null;
let lastServerFetchTime = 0;

export function invalidateServerCache() {
  serverDataCache = null;
  lastServerFetchTime = 0;
}

export async function fetchServerData(forceRefresh = false): Promise<any | null> {
  const now = Date.now();
  if (!forceRefresh && serverDataCache && now - lastServerFetchTime < 1500) {
    return serverDataCache;
  }
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        serverDataCache = json.data;
        lastServerFetchTime = now;
        return json.data;
      }
    }
  } catch {
    // API not available
  }
  return null;
}

export const FarmDB = {
  // --- Plantings ---
  async getPlantings(): Promise<Planting[]> {
    // 1. SUPABASE MASTER - Sumber Kebenaran Utama
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('plantings')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          localStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify(data));
          idbSet(STORAGE_KEYS.PLANTINGS, data).catch(() => {});
          return data;
        } else if (error) {
          console.warn('Supabase Master error (plantings):', error.message);
        }
      } catch (err) {
        console.warn('Supabase Master connection error (plantings):', err);
      }
    }

    // 2. Server Backend Mirror
    const serverData = await fetchServerData();
    if (serverData && Array.isArray(serverData.plantings)) {
      return serverData.plantings;
    }

    // 3. Fallback Offline Local Storage
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PLANTINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}

    // Return clean empty array - TIDAK ADA DATA MASTER
    return [];
  },

  async addPlanting(planting: Planting): Promise<{ planting: Planting; tasks: TaskItem[]; syncedToSupabase: boolean; error?: string }> {
    const autoTasks = generateTasksForPlanting(planting);

    // 1. Simpan di Local Storage & IndexedDB
    try {
      const rawPlantings = localStorage.getItem(STORAGE_KEYS.PLANTINGS);
      const plantings: Planting[] = rawPlantings ? JSON.parse(rawPlantings) : [];
      plantings.unshift(planting);
      localStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify(plantings));
      idbSet(STORAGE_KEYS.PLANTINGS, plantings).catch(() => {});

      const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const tasks: TaskItem[] = rawTasks ? JSON.parse(rawTasks) : [];
      const updatedTasks = [...autoTasks, ...tasks];
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
      idbSet(STORAGE_KEYS.TASKS, updatedTasks).catch(() => {});
    } catch {}

    // 2. Simpan ke Supabase jika terhubung
    let synced = false;
    let errMsg = undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Prepare payload
        const plantingPayload: any = {
          id: planting.id,
          crop_id: planting.crop_id || null,
          crop_name: planting.crop_name,
          variety: planting.variety,
          plot_name: planting.plot_name,
          area_sqm: planting.area_sqm,
          scale_quantity: planting.scale_quantity ?? planting.area_sqm,
          scale_unit: planting.scale_unit || 'm2',
          planting_date: planting.planting_date,
          estimated_harvest_date: planting.estimated_harvest_date,
          status: planting.status || 'active',
          notes: planting.notes || ''
        };

        // If crop_id is provided, try to ensure crops table accepts it or handle foreign key safely
        if (plantingPayload.crop_id) {
          try {
            await supabase.from('crops').upsert([{
              id: plantingPayload.crop_id,
              name: plantingPayload.crop_name,
              category: 'hortikultura'
            }], { onConflict: 'id' });
          } catch {}
        }

        let { error: pErr } = await supabase.from('plantings').insert([plantingPayload]);
        // If foreign key constraint failed, retry with crop_id: null
        if (pErr && pErr.message && pErr.message.toLowerCase().includes('foreign key')) {
          plantingPayload.crop_id = null;
          const retry = await supabase.from('plantings').insert([plantingPayload]);
          pErr = retry.error;
        }
        // If column error, remove optional scale columns
        if (pErr && pErr.message && pErr.message.toLowerCase().includes('column')) {
          delete plantingPayload.scale_quantity;
          delete plantingPayload.scale_unit;
          const retry = await supabase.from('plantings').insert([plantingPayload]);
          pErr = retry.error;
        }

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

    // 3. Simpan ke Server Backend
    try {
      await fetch('/api/plantings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planting, tasks: autoTasks })
      });
    } catch {}
    invalidateServerCache();

    // Broadcast Realtime Event
    broadcastRealtimeChange('plantings', 'INSERT', planting);

    return { planting, tasks: autoTasks, syncedToSupabase: synced, error: errMsg };
  },

  async deletePlanting(plantingId: string): Promise<{ success: boolean; error?: string }> {
    invalidateServerCache();

    // 1. Hapus dari Server Backend
    try {
      await fetch(`/api/plantings/${plantingId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Gagal delete di backend server:', err);
    }
    invalidateServerCache();

    // 2. Hapus dari Local Storage & IndexedDB
    try {
      const rawPlantings = localStorage.getItem(STORAGE_KEYS.PLANTINGS);
      if (rawPlantings) {
        const filtered = JSON.parse(rawPlantings).filter((p: Planting) => p.id !== plantingId);
        localStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify(filtered));
        idbSet(STORAGE_KEYS.PLANTINGS, filtered).catch(() => {});
      }

      const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (rawTasks) {
        const filtered = JSON.parse(rawTasks).filter((t: TaskItem) => t.planting_id !== plantingId);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
        idbSet(STORAGE_KEYS.TASKS, filtered).catch(() => {});
      }

      const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (rawLogs) {
        const filtered = JSON.parse(rawLogs).filter((l: ActivityLog) => l.planting_id !== plantingId);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(filtered));
        idbSet(STORAGE_KEYS.LOGS, filtered).catch(() => {});
      }

      const rawExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (rawExpenses) {
        const filtered = JSON.parse(rawExpenses).filter((e: ExpenseRecord) => e.planting_id !== plantingId);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
        idbSet(STORAGE_KEYS.EXPENSES, filtered).catch(() => {});
      }
    } catch {}

    // 3. Hapus dari Supabase Master
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        try { await supabase.from('tasks').delete().eq('planting_id', plantingId); } catch {}
        try { await supabase.from('activity_logs').delete().eq('planting_id', plantingId); } catch {}
        try { await supabase.from('expenses').delete().eq('planting_id', plantingId); } catch {}
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

    // Broadcast Realtime Delete Event
    broadcastRealtimeChange('plantings', 'DELETE', { id: plantingId });

    return { success: true };
  },

  // --- Tasks ---
  async getTasks(plantingId?: string): Promise<TaskItem[]> {
    // 1. SUPABASE MASTER
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
            idbSet(STORAGE_KEYS.TASKS, data).catch(() => {});
          }
          return data;
        } else if (error) {
          console.warn('Supabase Master error (tasks):', error.message);
        }
      } catch (err) {
        console.warn('Supabase Master connection error (tasks):', err);
      }
    }

    // 2. Server Backend Mirror
    const serverData = await fetchServerData();
    if (serverData && Array.isArray(serverData.tasks)) {
      if (plantingId && plantingId !== 'all') {
        return serverData.tasks.filter((t: any) => t.planting_id === plantingId);
      }
      return serverData.tasks;
    }

    // 3. Fallback Local Storage
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      const tasks: TaskItem[] = raw ? JSON.parse(raw) : [];
      if (plantingId && plantingId !== 'all') {
        return tasks.filter(t => t.planting_id === plantingId);
      }
      return tasks;
    } catch {}

    return [];
  },

  async toggleTaskCompletion(taskId: string, isCompleted: boolean, notes?: string): Promise<TaskItem | null> {
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
    idbSet(STORAGE_KEYS.TASKS, tasks).catch(() => {});

    // Update di Server Backend
    try {
      fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: isCompleted, completed_at: completedAt, completion_notes: notes })
      }).catch(() => {});
    } catch {}

    // Update di Supabase Master
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

    // Broadcast Realtime Update Event
    broadcastRealtimeChange('tasks', 'UPDATE', tasks[idx]);

    return tasks[idx];
  },

  async addTask(task: TaskItem): Promise<{ task: TaskItem; syncedToSupabase: boolean; error?: string }> {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks: TaskItem[] = raw ? JSON.parse(raw) : [];
    tasks.unshift(task);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    idbSet(STORAGE_KEYS.TASKS, tasks).catch(() => {});

    // Simpan ke Server Backend
    try {
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      }).catch(() => {});
    } catch {}

    let synced = false;
    let errMsg = undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
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

    // Broadcast Realtime Insert Event
    broadcastRealtimeChange('tasks', 'INSERT', task);

    return { task, syncedToSupabase: synced, error: errMsg };
  },

  async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    // Hapus dari Server Backend
    try {
      fetch(`/api/tasks/${taskId}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) {
      const tasks: TaskItem[] = JSON.parse(raw);
      const filtered = tasks.filter(t => t.id !== taskId);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
      idbSet(STORAGE_KEYS.TASKS, filtered).catch(() => {});
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

    // Broadcast Realtime Delete Event
    broadcastRealtimeChange('tasks', 'DELETE', { id: taskId });

    return { success: true };
  },

  // --- Logs (Catatan Lapangan & Buku Harian) ---
  async getLogs(plantingId?: string): Promise<ActivityLog[]> {
    // 1. SUPABASE MASTER
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
            idbSet(STORAGE_KEYS.LOGS, data).catch(() => {});
          }
          return data;
        } else if (error) {
          console.warn('Supabase Master error (logs):', error.message);
        }
      } catch (err) {
        console.warn('Supabase Master connection error (logs):', err);
      }
    }

    // 2. Server Backend Mirror
    const serverData = await fetchServerData();
    if (serverData && Array.isArray(serverData.logs)) {
      if (plantingId && plantingId !== 'all') {
        return serverData.logs.filter((l: any) => l.planting_id === plantingId);
      }
      return serverData.logs;
    }

    // 3. Fallback Local Storage
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      const logs: ActivityLog[] = raw ? JSON.parse(raw) : [];
      if (plantingId && plantingId !== 'all') {
        return logs.filter(l => l.planting_id === plantingId);
      }
      return logs;
    } catch {}

    return [];
  },

  async addLog(log: ActivityLog): Promise<{ log: ActivityLog; syncedToSupabase: boolean; error?: string }> {
    // 1. Simpan di local storage & IndexedDB
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      const logs: ActivityLog[] = raw ? JSON.parse(raw) : [];
      logs.unshift(log);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      idbSet(STORAGE_KEYS.LOGS, logs).catch(() => {});
    } catch {}

    // Simpan ke Server Backend
    try {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      }).catch(() => {});
    } catch {}

    // 2. Simpan di Supabase Master
    let synced = false;
    let errMsg = undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
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

    // Broadcast Realtime Insert Event
    broadcastRealtimeChange('activity_logs', 'INSERT', log);

    return { log, syncedToSupabase: synced, error: errMsg };
  },

  async deleteLog(logId: string): Promise<{ success: boolean; error?: string }> {
    // Hapus dari Server Backend
    try {
      fetch(`/api/logs/${logId}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

    // 1. Hapus dari local storage & IndexedDB
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (raw) {
        const logs: ActivityLog[] = JSON.parse(raw);
        const filtered = logs.filter(l => l.id !== logId);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(filtered));
        idbSet(STORAGE_KEYS.LOGS, filtered).catch(() => {});
      }
    } catch {}

    // 2. Hapus dari Supabase Master
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('activity_logs').delete().eq('id', logId);
        if (error) {
          console.error('Gagal hapus log di Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err?.message };
      }
    }

    // Broadcast Realtime Delete Event
    broadcastRealtimeChange('activity_logs', 'DELETE', { id: logId });

    return { success: true };
  },

  // --- Expenses (Buku Kas & Biaya Operasional) ---
  async getExpenses(plantingId?: string): Promise<ExpenseRecord[]> {
    // 1. SUPABASE MASTER
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
            idbSet(STORAGE_KEYS.EXPENSES, data).catch(() => {});
          }
          return data;
        } else if (error) {
          console.warn('Supabase Master error (expenses):', error.message);
        }
      } catch (err) {
        console.warn('Supabase Master connection error (expenses):', err);
      }
    }

    // 2. Server Backend Mirror
    const serverData = await fetchServerData();
    if (serverData && Array.isArray(serverData.expenses)) {
      if (plantingId && plantingId !== 'all') {
        return serverData.expenses.filter((e: any) => e.planting_id === plantingId);
      }
      return serverData.expenses;
    }

    // 3. Fallback Local Storage
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const expenses: ExpenseRecord[] = raw ? JSON.parse(raw) : [];
      if (plantingId && plantingId !== 'all') {
        return expenses.filter(e => e.planting_id === plantingId);
      }
      return expenses;
    } catch {}

    return [];
  },

  async addExpense(expense: ExpenseRecord): Promise<{ expense: ExpenseRecord; syncedToSupabase: boolean; error?: string }> {
    // 1. Simpan di local storage & IndexedDB
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const expenses: ExpenseRecord[] = raw ? JSON.parse(raw) : [];
      expenses.unshift(expense);
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      idbSet(STORAGE_KEYS.EXPENSES, expenses).catch(() => {});
    } catch {}

    // Simpan ke Server Backend
    try {
      fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      }).catch(() => {});
    } catch {}

    // 2. Simpan di Supabase Master
    let synced = false;
    let errMsg = undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
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

    // Broadcast Realtime Insert Event
    broadcastRealtimeChange('expenses', 'INSERT', expense);

    return { expense, syncedToSupabase: synced, error: errMsg };
  },

  async deleteExpense(expenseId: string): Promise<{ success: boolean; error?: string }> {
    // Hapus dari Server Backend
    try {
      fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

    // 1. Hapus dari local storage & IndexedDB
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (raw) {
        const expenses: ExpenseRecord[] = JSON.parse(raw);
        const filtered = expenses.filter(e => e.id !== expenseId);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
        idbSet(STORAGE_KEYS.EXPENSES, filtered).catch(() => {});
      }
    } catch {}

    // 2. Hapus dari Supabase Master
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
        if (error) {
          console.error('Gagal hapus expense di Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err?.message };
      }
    }

    // Broadcast Realtime Delete Event
    broadcastRealtimeChange('expenses', 'DELETE', { id: expenseId });

    return { success: true };
  },

  // Batch sync all local data to Supabase
  async syncAllLocalToSupabase(): Promise<{ success: boolean; message: string; count: { plantings: number; tasks: number; logs: number; expenses: number } }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, message: 'Supabase belum dikonfigurasi. Masukkan URL dan Anon Key terlebih dahulu.', count: { plantings: 0, tasks: 0, logs: 0, expenses: 0 } };
    }

    try {
      const rawPlantings = localStorage.getItem(STORAGE_KEYS.PLANTINGS);
      const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      const rawExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);

      const plantings: Planting[] = rawPlantings ? JSON.parse(rawPlantings) : [];
      const tasks: TaskItem[] = rawTasks ? JSON.parse(rawTasks) : [];
      const logs: ActivityLog[] = rawLogs ? JSON.parse(rawLogs) : [];
      const expenses: ExpenseRecord[] = rawExpenses ? JSON.parse(rawExpenses) : [];

      // 1. Sync Plantings
      if (plantings.length > 0) {
        const pPayloads = plantings.map(p => ({
          id: p.id,
          crop_id: p.crop_id || null,
          crop_name: p.crop_name,
          variety: p.variety,
          plot_name: p.plot_name,
          area_sqm: p.area_sqm,
          scale_quantity: p.scale_quantity ?? p.area_sqm,
          scale_unit: p.scale_unit || 'm2',
          planting_date: p.planting_date,
          estimated_harvest_date: p.estimated_harvest_date,
          status: p.status || 'active',
          notes: p.notes || ''
        }));
        let { error: pErr } = await supabase.from('plantings').upsert(pPayloads, { onConflict: 'id' });
        if (pErr && pErr.message && pErr.message.toLowerCase().includes('column')) {
          const stripped = pPayloads.map((item: any) => {
            const copy = { ...item };
            delete copy.scale_quantity;
            delete copy.scale_unit;
            return copy;
          });
          const retry = await supabase.from('plantings').upsert(stripped, { onConflict: 'id' });
          pErr = retry.error;
        }
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
        message: 'Seluruh data berhasil disinkronisasikan ke Supabase!',
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

  // Clear cache and force re-fetch directly from Supabase
  async clearLocalCacheAndReload(): Promise<void> {
    invalidateServerCache();
    localStorage.removeItem(STORAGE_KEYS.PLANTINGS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    idbSet(STORAGE_KEYS.PLANTINGS, []).catch(() => {});
    idbSet(STORAGE_KEYS.TASKS, []).catch(() => {});
    idbSet(STORAGE_KEYS.LOGS, []).catch(() => {});
    idbSet(STORAGE_KEYS.EXPENSES, []).catch(() => {});
  },

  async clearAllData(): Promise<{ success: boolean; error?: string }> {
    // Bersihkan di Server Backend
    try {
      await fetch('/api/data/clear-all', { method: 'POST' });
      serverDataCache = { plantings: [], tasks: [], logs: [], expenses: [] };
    } catch {}

    localStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    idbSet(STORAGE_KEYS.PLANTINGS, []).catch(() => {});
    idbSet(STORAGE_KEYS.TASKS, []).catch(() => {});
    idbSet(STORAGE_KEYS.LOGS, []).catch(() => {});
    idbSet(STORAGE_KEYS.EXPENSES, []).catch(() => {});

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
    const plantings = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANTINGS) || '[]');
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');

    const backup = {
      app: 'TaniGuide',
      version: '4.0',
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

      idbSet(STORAGE_KEYS.PLANTINGS, plantings).catch(() => {});
      idbSet(STORAGE_KEYS.TASKS, tasks).catch(() => {});
      idbSet(STORAGE_KEYS.LOGS, logs).catch(() => {});
      idbSet(STORAGE_KEYS.EXPENSES, expenses).catch(() => {});

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
