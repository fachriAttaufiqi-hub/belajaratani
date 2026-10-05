export type CropCategory = 'pangan' | 'hortikultura' | 'palawija' | 'buah';

export interface CropTemplate {
  id: string;
  name: string;
  latinName: string;
  category: CropCategory;
  varietyExamples: string[];
  harvestDaysMin: number;
  harvestDaysMax: number;
  icon: string;
  description: string;
  standardStages: TaskTemplate[];
  fertilizerGuide: {
    organicPerHa: string;
    chemicalPerHa: string;
    notes: string;
  };
}

export type TaskCategory = 'pemupukan' | 'penyiangan' | 'penyiraman' | 'pengendalian_hama' | 'perawatan' | 'panen';

export interface TaskTemplate {
  hst: number; // Hari Setelah Tanam (0 = saat tanam)
  title: string;
  category: TaskCategory;
  description: string;
  dosageRecommendation?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Planting {
  id: string;
  user_id?: string;
  crop_id: string;
  crop_name: string;
  variety: string;
  plot_name: string; // Misal: "Sawah Blok Timur", "Kebun Belakang"
  area_sqm: number; // Luas Lahan dalam m2
  planting_date: string; // YYYY-MM-DD
  estimated_harvest_date: string; // YYYY-MM-DD
  status: 'active' | 'harvested' | 'failed';
  notes?: string;
  created_at?: string;
}

export interface TaskItem {
  id: string;
  planting_id: string;
  user_id?: string;
  title: string;
  category: TaskCategory;
  hst: number;
  due_date: string; // YYYY-MM-DD
  dosage?: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  completed_at?: string | null;
  completion_notes?: string;
}

export interface ActivityLog {
  id: string;
  planting_id: string;
  user_id?: string;
  date: string;
  type: 'catatan_lapangan' | 'hama_penyakit' | 'cuaca' | 'pengeluaran' | 'panen';
  title: string;
  notes: string;
  weather_condition?: 'cerah' | 'hujan_ringan' | 'hujan_deras' | 'berawan' | 'kering_panas';
  cost_amount?: number;
  harvest_yield_kg?: number;
  created_at?: string;
}

export interface ExpenseRecord {
  id: string;
  planting_id: string;
  date: string;
  category: 'benih' | 'pupuk' | 'pestisida' | 'tenaga_kerja' | 'peralatan' | 'lainnya';
  item_name: string;
  amount: number;
  notes?: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  autoSync: boolean;
}
