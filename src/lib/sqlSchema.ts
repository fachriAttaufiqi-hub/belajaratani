/**
 * TaniGuide - Production-Ready Supabase DDL SQL Script
 * File: src/lib/sqlSchema.ts
 *
 * Skrip SQL PostgreSQL untuk Supabase:
 * - Tabel Crops, Plantings, Tasks, Activity Logs, Expenses
 * - Auto-seeding Master Komoditas Pertanian Nasional
 * - Row Level Security (RLS) Permisif
 * - Indexes & Timestamps Trigger
 */

export const SUPABASE_SQL_DDL = `-- ====================================================================
-- TaniGuide: Skrip DDL Database Supabase (PostgreSQL + RLS)
-- Eksekusi skrip ini di SQL Editor di dashboard Supabase Anda.
-- ====================================================================

-- 1. Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL: crops (Katalog Jenis Tanaman & Template SOP)
CREATE TABLE IF NOT EXISTS public.crops (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latin_name VARCHAR(100),
    category VARCHAR(50) NOT NULL, -- pangan, hortikultura, palawija, buah
    variety_examples TEXT[] DEFAULT '{}',
    harvest_days_min INT NOT NULL DEFAULT 60,
    harvest_days_max INT NOT NULL DEFAULT 120,
    icon VARCHAR(20) DEFAULT '🌱',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SEED SEGERA KATALOG CROPS AGAR FOREIGN KEY TIDAK GAGAL
INSERT INTO public.crops (id, name, latin_name, category, variety_examples, harvest_days_min, harvest_days_max, icon, description)
VALUES 
('padi', 'Padi Sawah (Oryza sativa)', 'Oryza sativa', 'pangan', ARRAY['Inpari 32', 'Ciherang', 'Mekongga', 'Inpari 42 GSR'], 105, 115, '🌾', 'Pangan utama Indonesia dengan manajemen air macak-macak dan pemupukan NPK berimbang.'),
('jagung', 'Jagung Hibrida / Manis (Zea mays)', 'Zea mays', 'palawija', ARRAY['Bisi 18', 'Pioneer P35', 'NK 212', 'Bonanza F1'], 70, 105, '🌽', 'Palawija berakar serabut dengan kebutuhan Nitrogen dan Fosfat tinggi.'),
('cabai', 'Cabai Rawit / Merah (Capsicum annuum)', 'Capsicum annuum', 'hortikultura', ARRAY['Ori 212', 'Pilar F1', 'Gada MK', 'Kaliber'], 75, 120, '🌶️', 'Hortikultura bernilai tinggi, sensitif genangan air, membutuhkan lanjaran ajir dan kocor nutrisi teratur.'),
('bawang_merah', 'Bawang Merah (Allium cepa var. aggregatum)', 'Allium cepa var. ascalonicum', 'hortikultura', ARRAY['Batu Ijo', 'Tajuk', 'Bauji', 'Sanren F1'], 55, 65, '🧅', 'Siklus panen cepat 60 hari, membutuhkan sinar matahari terik dan penyiraman rutin 2x sehari.'),
('tomat', 'Tomat Sayur / Buah (Solanum lycopersicum)', 'Solanum lycopersicum', 'hortikultura', ARRAY['Servo F1', 'Tymoti F1', 'Gustavi F1'], 65, 85, '🍅', 'Sayuran buah produktif dengan kebutuhan pemangkasan tunas air dan kalsium pencegah busuk pantat.'),
('kedelai', 'Kedelai (Glycine max)', 'Glycine max', 'palawija', ARRAY['Anjasmoro', 'Grobogan', 'Argomulyo'], 75, 85, '🫘', 'Tanaman legum penambat nitrogen bebas di udara lewat bintil akar rhizobium.'),
('semangka', 'Semangka / Melon (Citrullus lanatus)', 'Citrullus lanatus', 'buah', ARRAY['Inul F1', 'Amara F1', 'Action 88'], 60, 70, '🍉', 'Buah merambat dengan teknik penyerbukan bunga betina dan pengalasan buah.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    variety_examples = EXCLUDED.variety_examples,
    description = EXCLUDED.description;

-- 3. TABEL: plantings (Lahan / Plot Budidaya Aktif)
CREATE TABLE IF NOT EXISTS public.plantings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    crop_id TEXT REFERENCES public.crops(id) ON DELETE SET NULL,
    crop_name VARCHAR(100) NOT NULL,
    variety VARCHAR(100) NOT NULL,
    plot_name VARCHAR(120) NOT NULL,
    area_sqm NUMERIC(10, 2) NOT NULL DEFAULT 1000, -- Luas Lahan (m2)
    planting_date DATE NOT NULL,
    estimated_harvest_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, harvested, failed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TABEL: tasks (Jadwal & Checklist Kegiatan Bertani berbasis HST)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planting_id UUID NOT NULL REFERENCES public.plantings(id) ON DELETE CASCADE,
    user_id UUID,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- pemupukan, penyiangan, penyiraman, pengendalian_hama, perawatan, panen
    hst INT NOT NULL, -- Hari Setelah Tanam (0, 7, 14, dst.)
    due_date DATE NOT NULL,
    dosage TEXT,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABEL: activity_logs (Buku Catatan Digital & Kondisi Cuaca / Hama)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planting_id UUID NOT NULL REFERENCES public.plantings(id) ON DELETE CASCADE,
    user_id UUID,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(50) NOT NULL, -- catatan_lapangan, hama_penyakit, cuaca, panen, pengeluaran
    title VARCHAR(200) NOT NULL,
    notes TEXT NOT NULL,
    weather_condition VARCHAR(50), -- cerah, hujan_ringan, hujan_deras, berawan, kering_panas
    cost_amount NUMERIC(12, 2) DEFAULT 0,
    harvest_yield_kg NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. TABEL: expenses (Catatan Pengeluaran & Biaya Operasional Lahan)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planting_id UUID NOT NULL REFERENCES public.plantings(id) ON DELETE CASCADE,
    user_id UUID,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(50) NOT NULL, -- benih, pupuk, pestisida, tenaga_kerja, peralatan, lainnya
    item_name VARCHAR(150) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- INDEKS PERFORMA
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_plantings_status ON public.plantings(status);
CREATE INDEX IF NOT EXISTS idx_tasks_planting ON public.tasks(planting_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completion ON public.tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_logs_planting ON public.activity_logs(planting_id);
CREATE INDEX IF NOT EXISTS idx_expenses_planting ON public.expenses(planting_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Izinkan akses penuh untuk operasi API (anon key dan authenticated users)
CREATE POLICY "crops_policy" ON public.crops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "plantings_policy" ON public.plantings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tasks_policy" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "logs_policy" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "expenses_policy" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- TRIGGER: Otomatis perbarui kolom updated_at
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_plantings_updated_at ON public.plantings;
CREATE TRIGGER set_plantings_updated_at
    BEFORE UPDATE ON public.plantings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
`;
