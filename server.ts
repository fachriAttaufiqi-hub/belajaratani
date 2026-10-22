import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google Gemini AI client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })
  : null;

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
    scale_quantity: 2500,
    scale_unit: 'm2',
    planting_date: jagungPlantStr,
    estimated_harvest_date: jagungHarvestStr,
    status: 'active',
    notes: 'Jarak tanam 70x20 cm, pupuk dasar kompos kandang 500 kg.',
    created_at: new Date().toISOString()
  };

  // Plot 2: Cabai Rawit (HST 28 - Skala 500 Pohon)
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
    plot_name: 'Kebun Mulsa Blok B (500 Pohon)',
    area_sqm: 1200,
    scale_quantity: 500,
    scale_unit: 'pohon',
    planting_date: cabaiPlantStr,
    estimated_harvest_date: cabaiHarvestStr,
    status: 'active',
    notes: '500 pohon bedengan mulsa perak, pengocoran NPK & kalsium rutin.',
    created_at: new Date().toISOString()
  };

  // Plot 3: Padi Sawah (HST 45 - 0.5 Hektar)
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
    plot_name: 'Sawah Irigasi Desa C (0.5 Ha)',
    area_sqm: 5000,
    scale_quantity: 0.5,
    scale_unit: 'hektar',
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

function normalizeGeminiContents(history: any[], currentMessage: string) {
  const rawList: { role: 'user' | 'model'; text: string }[] = [];
  if (Array.isArray(history)) {
    for (const item of history) {
      if (item && item.text && (item.role === 'user' || item.role === 'model')) {
        rawList.push({ role: item.role, text: String(item.text).trim() });
      }
    }
  }
  rawList.push({ role: 'user', text: currentMessage.trim() });

  // Gemini requires:
  // 1. Multi-turn must start with 'user'
  // 2. Turns must strictly alternate
  const normalized: { role: 'user' | 'model'; parts: [{ text: string }] }[] = [];

  for (const item of rawList) {
    if (!item.text) continue;
    if (normalized.length === 0) {
      if (item.role === 'user') {
        normalized.push({ role: 'user', parts: [{ text: item.text }] });
      }
      // If the very first was 'model' (e.g. initial greeting), skip it so we start with user
    } else {
      const last = normalized[normalized.length - 1];
      if (last.role === item.role) {
        last.parts[0].text += `\n\n${item.text}`;
      } else {
        normalized.push({ role: item.role, parts: [{ text: item.text }] });
      }
    }
  }

  if (normalized.length === 0 || normalized[normalized.length - 1].role !== 'user') {
    normalized.push({ role: 'user', parts: [{ text: currentMessage.trim() }] });
  }

  return normalized;
}

// Fallback cerdas agronomi Indonesia bila API model mengalami lonjakan antrean
function generateAgronomyFallbackReply(message: string, plotContext?: any): string {
  const crop = (plotContext?.crop_name || 'tanaman budidaya').toLowerCase();
  const hst = plotContext?.hst !== undefined ? plotContext.hst : 15;
  const scale = plotContext?.scale_quantity ? `${plotContext.scale_quantity} ${plotContext.scale_unit || 'pohon'}` : 'skala kebun';

  let advice = `Salam Tani! 🌱 Berikut panduan agronomi praktis untuk **${plotContext?.crop_name || 'Tanaman Anda'}** (${scale}) pada fase saat ini (${hst} HST):\n\n`;

  if (hst <= 10) {
    advice += `### 1. Fase Pemulihan & Perakaran Awal (0 - 10 HST)
* **Kebutuhan Air:** Siram secukupnya tiap pagi atau sore hari, pastikan media lembap namun tidak becek tergenang.
* **Perlindungan:** Pasang ajir/lanjaran bila diperlukan dan amati ada tidaknya gigitan ulat pemotong atau siput.
* **Nutrisi:** Berikan larutan asam humat atau pupuk hayati organik cair encer untuk merangsang pertumbuhan akar baru.`;
  } else if (hst <= 30) {
    advice += `### 1. Fase Vegetatif Aktif & Pembentukan Cabang (${hst} HST)
* **Pemupukan Kocor (Per Pohon/Polybag):** Larutkan 10–15 gram pupuk NPK 16-16-16 dalam 200–250 ml air per pohon tiap 7–10 hari sekali.
* **Untuk Skala Hamparan/Lahan:** Taburkan 50–75 kg NPK per hektar di parit sela tanaman lalu tutup tipis tanah.
* **Perompesan (Pewiwilan):** Buang tunas air (wiwil) di ketiak daun di bawah cabang utama (cabang V) agar energi terfokus ke batang utama.
* **Pencegahan Hama:** Semprotkan pestisida nabati atau insektisida berbahan aktif abamektin tipis-tipis di balik daun untuk mencegah kutu kebul dan thrips.`;
  } else if (hst <= 60) {
    advice += `### 1. Fase Generatif & Pembungaan (${hst} HST)
* **Nutrisi Khusus Bunga & Bakal Buah:** Tambahkan unsur Fosfor (P) dan Kalium (K), seperti pupuk MKP (Monokalium Fosfat) atau KNO3 Putih + Kalsium Boron (1 sendok makan per tangki 16L).
* **Manajemen Bunga:** Hindari penyemprotan kimia keras di pagi hari saat lebah/serangga penyerbuk aktif agar bunga tidak rontok.
* **Pengairan:** Jaga kelembaban tanah tetap stabil. Tanah yang terlalu kering lalu tiba-tiba basah kuyup dapat memicu kerontokan bunga secara massal.`;
  } else {
    advice += `### 1. Fase Pembesaran Buah & Menjelang Panen (${hst} HST)
* **Penguatan Bobot Buah:** Berikan pupuk Kalium tinggi (KCl atau KNO3 Putih) dan Kalsium untuk mencegah buah busuk ujung pantat (blossom end rot) atau antraknosa (patek).
* **Sanitasi Lahan:** Pangkas daun-daun tua bagian bawah yang mulai menguning untuk melancarkan sirkulasi udara di bawah kanopi.
* **Panen:** Petik buah saat matang fisiologis (80-90% kemerahan untuk cabai/tomat, bulir bernas menguning untuk padi/jagung).`;
  }

  advice += `\n\n### 2. Tips Pengendalian Hama & Penyakit (PHT)
* **Penyakit Jamur (Antraknosa/Bercak Daun):** Pastikan drainase parit tidak ada genangan air hujan. Semprot fungisida Mankozeb atau Azoksistrobin jika terlihat bercak basah.
* **Hama Pengisap (Thrips & Kutu Daun):** Gunakan perekat kuning (yellow sticky trap) di sela bedengan dan sanitasi gulma di sekitar pematang kebun.

Ada bagian khusus dari jadwal atau takaran pupuk ini yang ingin Anda tanyakan lebih lanjut, Rekan Petani?`;

  return advice;
}

// Fallback tasks generator
function generateAgronomyFallbackTasks(cropName: string, scaleQty?: number, scaleUnit?: string) {
  const isPohon = scaleUnit === 'pohon' || scaleUnit === 'polybag' || scaleUnit === 'batang';
  const scaleText = scaleQty ? `${scaleQty} ${scaleUnit || 'pohon'}` : 'lahan';

  return [
    {
      title: 'Pemupukan Dasar & Pengolahan Media',
      category: 'pemupukan',
      hst: 0,
      dosage: isPohon ? '200 gram pupuk kandang + 5g SP-36 per lubang tanam' : '1–2 ton kompos + 100 kg SP-36 per hektar',
      description: 'Campurkan pupuk organik dan fosfat ke tanah sebelum penanaman agar hara siap diserap akar bibit.',
      priority: 'high'
    },
    {
      title: 'Pemberian Pupuk Susulan I (Fase Awal Vegetatif)',
      category: 'pemupukan',
      hst: 10,
      dosage: isPohon ? '5–10 gram NPK 16-16-16 dilarutkan ke 200 ml air per tanaman' : '75 kg NPK 16-16-16 per hektar',
      description: 'Kocor di lingkaran perakaran untuk merangsang percepatan tunas daun dan anakan baru.',
      priority: 'high'
    },
    {
      title: 'Pewiwilan Tunas Air & Penyiangan Gulma',
      category: 'penyiangan',
      hst: 20,
      dosage: 'Alat pangkas steril / penyiangan manual',
      description: 'Buang tunas liar di ketiak daun bagian bawah dan bersihkan rumput liar agar nutrisi tidak terbagi.',
      priority: 'medium'
    },
    {
      title: 'Pemupukan Susulan II & Monitoring Hama',
      category: 'pemupukan',
      hst: 30,
      dosage: isPohon ? '15 gram NPK Mutiara per pohon' : '100 kg NPK per hektar',
      description: 'Aplikasi pupuk lanjutan dan semprot insektisida nabati/kontak bila ditemukan kutu daun atau ulat.',
      priority: 'high'
    },
    {
      title: 'Aplikasi Nutrisi Pembungaan & Kalsium',
      category: 'perawatan',
      hst: 45,
      dosage: '2–3 gram MKP + Kalsium Boron per liter air semprot',
      description: 'Semprot pada kabut daun pagi hari untuk memperkuat tangkai bunga dan mencegah kerontokan buah muda.',
      priority: 'high'
    },
    {
      title: 'Pengendalian Hama & Penyakit Buah',
      category: 'pengendalian_hama',
      hst: 60,
      dosage: 'Fungisida mankozeb sesuai anjuran label',
      description: 'Pencegahan busuk buah, antraknosa (patek), dan lalat buah menjelang pematangan hasil.',
      priority: 'medium'
    },
    {
      title: 'Panen Raya & Seleksi Hasil',
      category: 'panen',
      hst: 85,
      dosage: 'Gunting panen / keranjang bersih',
      description: 'Panen buah/hasil yang telah masak fisiologis pada pagi hari untuk menjaga kesegaran komoditas.',
      priority: 'high'
    }
  ];
}

async function generateGeminiContent(params: {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
  responseMimeType?: string;
}) {
  if (!ai) throw new Error('GEMINI_API_KEY belum dikonfigurasi di server.');

  const models = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.temperature !== undefined) config.temperature = params.temperature;
      if (params.topP !== undefined) config.topP = params.topP;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || '');
      console.warn(`[Gemini] Model ${model} returned error (${errMsg.slice(0, 100)}), trying next model...`);
      continue;
    }
  }
  throw lastError;
}

// ====================================================================
// ASISTEN AI TANIGUIDE (Jadwal & Langkah Perawatan Tanaman)
// ====================================================================
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, plotContext, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong' });
    }

    let systemInstruction = `Anda adalah "Asisten Ahli Tani TaniGuide" — pakar agronomi, praktisi pertanian modern, dan konsultan budidaya tanaman pangan dan hortikultura di Indonesia (Padi, Jagung, Cabai, Tomat, Bawang Merah, Semangka/Melon, Kedelai, sayuran pekarangan, dan tanaman buah).

FOKUS UTAMA KONSULTASI ANDA:
1. Jadwal Perawatan Tanaman (Timeline HST / Hari Setelah Tanam):
   - Jelaskan jadwal perawatan penting sesuai fase tanaman (fase bibit/vegetatif awal, anakan/percabangan aktif, pembungaan, pembesaran buah/bulir, pematangan, panen).
2. Langkah-Langkah Perawatan Tanaman yang Baik:
   - Pemupukan berimbang: rekomendasi jenis pupuk (NPK, Urea, SP-36, KCl, Kalsium/KNO3, pupuk kandang/kompos, pupuk hayati/POC).
   - Takaran presisi: sediakan takaran baik untuk satuan hektar/m² maupun satuan POHON/BATANG/POLYBAG (misal: "10-15 gram NPK larutkan 200 ml air per pohon").
   - Penyiraman & drainase: jadwal dan teknik penyiraman (kapan butuh air banyak, kapan harus dikeringkan/stop air sebelum panen).
   - Pemangkasan (pruning tunas air / pewiwilan) untuk memaksimalkan hasil.
   - Pengendalian Hama & Penyakit Terpadu (PHT): identifikasi gejala (kutu kebul, thrips, ulat grayak, sundep/beluk, antraknosa/patek, layu fusarium, jamur) dan penanganannya secara ramah lingkungan maupun kimiawi darurat.
3. Gaya Bahasa & Format:
   - Gunakan bahasa Indonesia yang bersahabat, menyemangati ("Rekan Petani", "Salam Tani!").
   - Format rapi dengan heading singkat, bullet points, dan instruksi langkah demi langkah yang mudah dipraktikkan langsung di kebun.`;

    if (plotContext) {
      systemInstruction += `\n\nDATA LAHAN BUDIDAYA AKTIF PENGGUNA SAAT INI:
- Nama Plot: ${plotContext.plot_name || '-'}
- Komoditas: ${plotContext.crop_name || '-'} (${plotContext.variety || 'Lokal'})
- Umur Saat Ini: ${plotContext.hst !== undefined ? `${plotContext.hst} HST (Hari Setelah Tanam)` : '-'}
- Skala / Jumlah: ${plotContext.scale_quantity || '-'} ${plotContext.scale_unit || 'm²'} (Luas fisik: ~${plotContext.area_sqm || '-'} m²)
- Tanggal Tanam: ${plotContext.planting_date || '-'}
- Estimasi Panen: ${plotContext.estimated_harvest_date || '-'}
${plotContext.pending_tasks && plotContext.pending_tasks.length > 0 ? `- Agenda Perawatan Terdekat: ${plotContext.pending_tasks.join(', ')}` : ''}

Gunakan data lahan aktif di atas agar jawaban Anda sangat spesifik, relevan, dan langsung dapat diaplikasikan pengguna di lahannya!`;
    }

    const contents = normalizeGeminiContents(history, message);

    if (ai) {
      try {
        const response = await generateGeminiContent({
          contents,
          systemInstruction,
          temperature: 0.7,
          topP: 0.95
        });

        const reply = response.text;
        if (reply && reply.trim().length > 0) {
          return res.json({ success: true, reply });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, using agronomy engine fallback:', geminiError?.message);
      }
    }

    // Jika Gemini API sedang antre atau offline, berikan fallback agronomi presisi
    const fallbackReply = generateAgronomyFallbackReply(message, plotContext);
    return res.json({ success: true, reply: fallbackReply });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    const fallbackReply = generateAgronomyFallbackReply(req.body?.message || '', req.body?.plotContext);
    return res.json({ success: true, reply: fallbackReply });
  }
});

// Rekomendasi Jadwal SOP Khusus Berbasis AI
app.post('/api/ai/generate-tasks', async (req, res) => {
  try {
    const { cropName, variety, scaleQty, scaleUnit, plantingDate } = req.body;
    if (!cropName) {
      return res.status(400).json({ success: false, message: 'Nama komoditas harus diisi' });
    }

    const prompt = `Anda adalah pakar agronomi Indonesia. Buatkan jadwal tahapan perawatan dan checklist tugas budidaya tanaman untuk:
Komoditas: ${cropName}
Varietas: ${variety || 'Unggul / Lokal'}
Skala Budidaya: ${scaleQty || 50} ${scaleUnit || 'pohon'}
Tanggal Tanam: ${plantingDate || formatDate(new Date())}

Buatkan 5 sampai 7 jadwal kegiatan perawatan titik kritis terpenting (fase pemupukan dasar, penyiangan, pemupukan susulan, pencegahan hama/penyakit, fase generatif, hingga panen).
Kembalikan HANYA JSON array murni tanpa markdown/penjelasan tambahan, dengan format:
[
  {
    "title": "Judul kegiatan",
    "category": "pemupukan",
    "hst": 7,
    "dosage": "rekomendasi takaran pupuk per pohon atau per m2",
    "description": "langkah pelaksanaan perawatan yang baik",
    "priority": "high"
  }
]
Kategori yang valid: "pemupukan" | "penyiangan" | "penyiraman" | "pengendalian_hama" | "perawatan" | "panen".
Prioritas yang valid: "high" | "medium" | "low".`;

    if (ai) {
      try {
        const response = await generateGeminiContent({
          contents: prompt,
          responseMimeType: 'application/json'
        });

        const jsonText = response.text?.trim() || '[]';
        const tasks = JSON.parse(jsonText);
        if (Array.isArray(tasks) && tasks.length > 0) {
          return res.json({ success: true, tasks });
        }
      } catch (geminiError: any) {
        console.warn('Gemini tasks call failed, using agronomy tasks fallback:', geminiError?.message);
      }
    }

    const fallbackTasks = generateAgronomyFallbackTasks(cropName, scaleQty, scaleUnit);
    return res.json({ success: true, tasks: fallbackTasks });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-tasks:', error);
    const fallbackTasks = generateAgronomyFallbackTasks(req.body?.cropName || 'Cabai', req.body?.scaleQty, req.body?.scaleUnit);
    return res.json({ success: true, tasks: fallbackTasks });
  }
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
