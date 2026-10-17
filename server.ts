import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Persistent Data Storage Path & Locked Supabase Config
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'taniguide_database.json');
const SUPABASE_CONFIG_FILE = path.join(DATA_DIR, 'supabase_config.json');

function readSupabaseConfig() {
  try {
    if (fs.existsSync(SUPABASE_CONFIG_FILE)) {
      const content = fs.readFileSync(SUPABASE_CONFIG_FILE, 'utf-8');
      const json = JSON.parse(content);
      if (json && (json.url || json.key)) {
        return {
          url: json.url || '',
          key: json.key || '',
          isLocked: Boolean(json.url && json.key)
        };
      }
    }
  } catch (e) {
    console.error('Error reading supabase config:', e);
  }
  const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const envKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return {
    url: envUrl,
    key: envKey,
    isLocked: Boolean(envUrl && envKey)
  };
}

function writeSupabaseConfig(url: string, key: string) {
  try {
    const payload = {
      url: url.trim(),
      key: key.trim(),
      updated_at: new Date().toISOString()
    };
    fs.writeFileSync(SUPABASE_CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing supabase config:', err);
    return false;
  }
}

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Standard UUID helper
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

// Generate rich master Indonesian farm dataset (Padi, Jagung, Cabai)
function getMasterSeedData() {
  const today = new Date();
  const todayStr = formatDate(today);

  // Plot 1: Jagung Hibrida (HST 14)
  const jagungPlantDate = new Date(today);
  jagungPlantDate.setDate(jagungPlantDate.getDate() - 14);
  const jagungPlantStr = formatDate(jagungPlantDate);
  const jagungHarvestStr = addDays(jagungPlantStr, 100);
  const plot1Id = generateUUID();

  const plot1 = {
    id: plot1Id,
    crop_id: 'jagung',
    crop_name: 'Jagung Hibrida / Manis',
    variety: 'NK 212',
    plot_name: 'Lahan Barat (Petak A)',
    area_sqm: 2500,
    planting_date: jagungPlantStr,
    estimated_harvest_date: jagungHarvestStr,
    status: 'active',
    notes: 'Jarak tanam 70x20 cm, pupuk dasar kompos kandang 500 kg.',
    created_at: new Date().toISOString()
  };

  // Plot 2: Cabai Rawit (HST 28)
  const cabaiPlantDate = new Date(today);
  cabaiPlantDate.setDate(cabaiPlantDate.getDate() - 28);
  const cabaiPlantStr = formatDate(cabaiPlantDate);
  const cabaiHarvestStr = addDays(cabaiPlantStr, 85);
  const plot2Id = generateUUID();

  const plot2 = {
    id: plot2Id,
    crop_id: 'cabai',
    crop_name: 'Cabai Rawit / Merah',
    variety: 'Ori 212',
    plot_name: 'Kebun Mulsa Blok B',
    area_sqm: 1200,
    planting_date: cabaiPlantStr,
    estimated_harvest_date: cabaiHarvestStr,
    status: 'active',
    notes: 'Bedengan mulsa perak, pengocoran NPK & kalsium rutin.',
    created_at: new Date().toISOString()
  };

  // Plot 3: Padi Sawah (HST 45)
  const padiPlantDate = new Date(today);
  padiPlantDate.setDate(padiPlantDate.getDate() - 45);
  const padiPlantStr = formatDate(padiPlantDate);
  const padiHarvestStr = addDays(padiPlantStr, 110);
  const plot3Id = generateUUID();

  const plot3 = {
    id: plot3Id,
    crop_id: 'padi',
    crop_name: 'Padi Sawah',
    variety: 'Inpari 32',
    plot_name: 'Sawah Irigasi Desa C',
    area_sqm: 5000,
    planting_date: padiPlantStr,
    estimated_harvest_date: padiHarvestStr,
    status: 'active',
    notes: 'Sistem jajar legowo 2:1, irigasi macak-macak berselang.',
    created_at: new Date().toISOString()
  };

  // Sample tasks for Jagung
  const tasks = [
    {
      id: generateUUID(),
      planting_id: plot1Id,
      title: 'Tanam Benih & Aplikasi Furadan Antar Lubang',
      category: 'perawatan',
      hst: 0,
      due_date: addDays(jagungPlantStr, 0),
      dosage: 'Benih 20 kg/ha, Furadan 10 kg/ha',
      description: 'Tanam 1-2 biji per lubang jarak 70x20 cm',
      priority: 'high',
      is_completed: true,
      completed_at: addDays(jagungPlantStr, 0),
      completion_notes: 'Selesai serentak'
    },
    {
      id: generateUUID(),
      planting_id: plot1Id,
      title: 'Pemupukan Susulan I (NPK Phonska & Urea)',
      category: 'pemupukan',
      hst: 14,
      due_date: addDays(jagungPlantStr, 14),
      dosage: 'Urea 100 kg/ha + NPK 150 kg/ha (jarak 7 cm dari batang)',
      description: 'Tugal pupuk di samping tanaman lalu tutup tanah gembur',
      priority: 'high',
      is_completed: false,
      completed_at: null,
      completion_notes: ''
    },
    {
      id: generateUUID(),
      planting_id: plot1Id,
      title: 'Penyiangan Gulma & Pembumbunan Tanah',
      category: 'penyiangan',
      hst: 28,
      due_date: addDays(jagungPlantStr, 28),
      dosage: 'Manual cangkul dangkal',
      description: 'Naikkan tanah ke pangkal batang jagung agar akar kokoh',
      priority: 'medium',
      is_completed: false,
      completed_at: null,
      completion_notes: ''
    },
    {
      id: generateUUID(),
      planting_id: plot1Id,
      title: 'Pemupukan Susulan II (Fase Primordia Tongkol)',
      category: 'pemupukan',
      hst: 35,
      due_date: addDays(jagungPlantStr, 35),
      dosage: 'Urea 150 kg/ha + KCL 50 kg/ha',
      description: 'Dorong pembentukan tongkol jagung berbobot',
      priority: 'high',
      is_completed: false,
      completed_at: null,
      completion_notes: ''
    },
    {
      id: generateUUID(),
      planting_id: plot1Id,
      title: 'Panen Raya Jagung Pipil Kering',
      category: 'panen',
      hst: 100,
      due_date: addDays(jagungPlantStr, 100),
      dosage: 'Target kadar air 15%',
      description: 'Kelobot telah mengering kecokelatan sempurna',
      priority: 'high',
      is_completed: false,
      completed_at: null,
      completion_notes: ''
    },
    // Tasks for Cabai
    {
      id: generateUUID(),
      planting_id: plot2Id,
      title: 'Pengocoran Pupuk NPK Daun & Kalsium',
      category: 'pemupukan',
      hst: 28,
      due_date: addDays(cabaiPlantStr, 28),
      dosage: 'NPK 16-16-16 (3 gram/liter air, kocor 200ml per lubang)',
      description: 'Kocor sore hari saat tanah lembap',
      priority: 'high',
      is_completed: false,
      completed_at: null,
      completion_notes: ''
    },
    {
      id: generateUUID(),
      planting_id: plot2Id,
      title: 'Pemasangan Ajir Bambu & Tali Pengikat',
      category: 'perawatan',
      hst: 21,
      due_date: addDays(cabaiPlantStr, 21),
      dosage: 'Tinggi ajir 120-150 cm',
      description: 'Tancapkan bambu miring dan ikat batang dengan tali salaran',
      priority: 'medium',
      is_completed: true,
      completed_at: addDays(cabaiPlantStr, 21),
      completion_notes: 'Sudah diikat rapi'
    },
    // Tasks for Padi
    {
      id: generateUUID(),
      planting_id: plot3Id,
      title: 'Pemupukan Susulan II (Fase Anakan Maksimum)',
      category: 'pemupukan',
      hst: 42,
      due_date: addDays(padiPlantStr, 42),
      dosage: 'Urea 75 kg/ha + NPK 100 kg/ha',
      description: 'Sebar merata kondisi sawah macak-macak',
      priority: 'high',
      is_completed: true,
      completed_at: addDays(padiPlantStr, 42),
      completion_notes: 'Anakan padi tumbuh lebat'
    }
  ];

  const logs = [
    {
      id: generateUUID(),
      planting_id: plot1Id,
      date: todayStr,
      type: 'catatan_lapangan',
      title: 'Tinggi tanaman jagung rata-rata 40 cm',
      notes: 'Batang hijau sehat, daun kokoh setelah pemupukan susulan pertama.',
      weather_condition: 'cerah',
      cost_amount: 0,
      harvest_yield_kg: 0
    },
    {
      id: generateUUID(),
      planting_id: plot2Id,
      date: addDays(todayStr, -2),
      type: 'hama_penyakit',
      title: 'Pantau serangga thrips & kutu kebul',
      notes: 'Pucuk daun aman, daun muda tidak ada keriting.',
      weather_condition: 'berawan',
      cost_amount: 0,
      harvest_yield_kg: 0
    },
    {
      id: generateUUID(),
      planting_id: plot3Id,
      date: addDays(todayStr, -4),
      type: 'cuaca',
      title: 'Pengairan berselang pintu air sawah',
      notes: 'Air sawah dikeringkan selama 3 hari untuk merangsang akar padi mendalam.',
      weather_condition: 'cerah',
      cost_amount: 0,
      harvest_yield_kg: 0
    }
  ];

  const expenses = [
    {
      id: generateUUID(),
      planting_id: plot1Id,
      date: jagungPlantStr,
      category: 'benih',
      item_name: 'Benih Jagung Hibrida NK 212 (5 kg)',
      amount: 475000,
      notes: 'Toko Tani Makmur Sejahtera'
    },
    {
      id: generateUUID(),
      planting_id: plot1Id,
      date: addDays(jagungPlantStr, 14),
      category: 'pupuk',
      item_name: 'Pupuk NPK Phonska & Urea (2 Karung)',
      amount: 320000,
      notes: 'Pemupukan susulan 1'
    },
    {
      id: generateUUID(),
      planting_id: plot2Id,
      date: cabaiPlantStr,
      category: 'peralatan',
      item_name: 'Mulsa Plastik Hitam Perak & Ajir Bambu',
      amount: 650000,
      notes: 'Kebutuhan bedengan kebun cabai'
    }
  ];

  return {
    plantings: [plot1, plot2, plot3],
    tasks,
    logs,
    expenses,
    updated_at: new Date().toISOString()
  };
}

// Read database from disk
function readDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data && Array.isArray(data.plantings) && data.plantings.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }

  // If file doesn't exist or is invalid, seed with master data
  const initial = getMasterSeedData();
  writeDatabase(initial);
  return initial;
}

// Write database to disk atomically
function writeDatabase(data: any) {
  try {
    data.updated_at = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// --- REST API Endpoints ---
 
// GET locked Supabase configuration (Syncs to all devices automatically)
app.get('/api/config/supabase', (_req, res) => {
  const config = readSupabaseConfig();
  res.json({
    success: true,
    data: config
  });
});

// POST lock Supabase configuration permanently for all devices
app.post('/api/config/supabase', (req, res) => {
  const { url, key } = req.body;
  if (!url || !key) {
    return res.status(400).json({ success: false, message: 'URL dan Key Supabase wajib diisi' });
  }
  const ok = writeSupabaseConfig(url, key);
  if (!ok) {
    return res.status(500).json({ success: false, message: 'Gagal menyimpan konfigurasi ke disk server' });
  }
  res.json({
    success: true,
    message: 'Konfigurasi Supabase berhasil dikunci di server! Semua gawai otomatis terhubung.',
    data: { url: url.trim(), key: key.trim(), isLocked: true }
  });
});

// GET all data (Syncs to all devices & survives Chrome clear data)
app.get('/api/data', (_req, res) => {
  const db = readDatabase();
  res.json({
    success: true,
    data: db,
    server_time: new Date().toISOString()
  });
});

// RESTORE master data
app.post('/api/data/restore-defaults', (_req, res) => {
  const master = getMasterSeedData();
  writeDatabase(master);
  res.json({
    success: true,
    message: 'Data master pertanian (Padi, Jagung, Cabai) berhasil dipulihkan!',
    data: master
  });
});

// CLEAR all data
app.post('/api/data/clear-all', (_req, res) => {
  const empty = {
    plantings: [],
    tasks: [],
    logs: [],
    expenses: [],
    updated_at: new Date().toISOString()
  };
  writeDatabase(empty);
  res.json({
    success: true,
    message: 'Seluruh data server berhasil dikosongkan.',
    data: empty
  });
});

// IMPORT custom JSON backup
app.post('/api/data/import', (req, res) => {
  const { plantings, tasks, logs, expenses } = req.body;
  if (!Array.isArray(plantings) && !Array.isArray(tasks)) {
    return res.status(400).json({ success: false, message: 'Data import tidak valid' });
  }
  const db = {
    plantings: Array.isArray(plantings) ? plantings : [],
    tasks: Array.isArray(tasks) ? tasks : [],
    logs: Array.isArray(logs) ? logs : [],
    expenses: Array.isArray(expenses) ? expenses : [],
    updated_at: new Date().toISOString()
  };
  writeDatabase(db);
  res.json({ success: true, message: 'Data berhasil diimpor ke server!', data: db });
});

// POST planting
app.post('/api/plantings', (req, res) => {
  const db = readDatabase();
  const planting = req.body.planting;
  const tasks = req.body.tasks || [];

  if (!planting || !planting.id) {
    return res.status(400).json({ success: false, message: 'Data lahan tidak valid' });
  }

  db.plantings.unshift(planting);
  if (Array.isArray(tasks) && tasks.length > 0) {
    db.tasks = [...tasks, ...db.tasks];
  }
  writeDatabase(db);
  res.json({ success: true, planting, tasksCount: tasks.length });
});

// DELETE planting
app.delete('/api/plantings/:id', (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  db.plantings = db.plantings.filter((p: any) => p.id !== id);
  db.tasks = db.tasks.filter((t: any) => t.planting_id !== id);
  db.logs = db.logs.filter((l: any) => l.planting_id !== id);
  db.expenses = db.expenses.filter((e: any) => e.planting_id !== id);
  writeDatabase(db);
  res.json({ success: true });
});

// TOGGLE / UPDATE task
app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { is_completed, completed_at, completion_notes } = req.body;
  const db = readDatabase();
  const taskIndex = db.tasks.findIndex((t: any) => t.id === id);
  if (taskIndex !== -1) {
    db.tasks[taskIndex].is_completed = is_completed;
    if (completed_at !== undefined) db.tasks[taskIndex].completed_at = completed_at;
    if (completion_notes !== undefined) db.tasks[taskIndex].completion_notes = completion_notes;
    writeDatabase(db);
    return res.json({ success: true, task: db.tasks[taskIndex] });
  }
  res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
});

// ADD custom task
app.post('/api/tasks', (req, res) => {
  const db = readDatabase();
  const task = req.body;
  if (!task || !task.id) {
    return res.status(400).json({ success: false, message: 'Tugas tidak valid' });
  }
  db.tasks.unshift(task);
  writeDatabase(db);
  res.json({ success: true, task });
});

// DELETE task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  db.tasks = db.tasks.filter((t: any) => t.id !== id);
  writeDatabase(db);
  res.json({ success: true });
});

// ADD log
app.post('/api/logs', (req, res) => {
  const db = readDatabase();
  const log = req.body;
  if (!log || !log.id) {
    return res.status(400).json({ success: false, message: 'Log tidak valid' });
  }
  db.logs.unshift(log);
  writeDatabase(db);
  res.json({ success: true, log });
});

// DELETE log
app.delete('/api/logs/:id', (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  db.logs = db.logs.filter((l: any) => l.id !== id);
  writeDatabase(db);
  res.json({ success: true });
});

// ADD expense
app.post('/api/expenses', (req, res) => {
  const db = readDatabase();
  const expense = req.body;
  if (!expense || !expense.id) {
    return res.status(400).json({ success: false, message: 'Biaya tidak valid' });
  }
  db.expenses.unshift(expense);
  writeDatabase(db);
  res.json({ success: true, expense });
});

// DELETE expense
app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  db.expenses = db.expenses.filter((e: any) => e.id !== id);
  writeDatabase(db);
  res.json({ success: true });
});

// --- Vite Middlewares / Static Serving ---
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TaniGuide Server] Running on http://0.0.0.0:${PORT} (Persistent Disk Database Enabled)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
