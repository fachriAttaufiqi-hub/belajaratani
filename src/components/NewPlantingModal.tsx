import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Check, 
  Sprout, 
  Info,
  Trees
} from 'lucide-react';
import { Planting, ScaleUnit } from '../types';
import { addDays, formatDate, generateUUID } from '../lib/storage';
import { SCALE_UNITS, SCALE_UNIT_LIST, calculateEquivalentSqm } from '../lib/scaleUnits';

interface NewPlantingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlanting: (planting: Planting) => void;
}

const COMMON_CROPS = [
  { name: 'Jagung', variety: 'NK 212', harvestDays: 100, icon: '🌽' },
  { name: 'Cabai Rawit', variety: 'Ori 212', harvestDays: 85, icon: '🌶️' },
  { name: 'Padi Sawah', variety: 'Inpari 32', harvestDays: 110, icon: '🌾' },
  { name: 'Bawang Merah', variety: 'Batu Ijo', harvestDays: 60, icon: '🧅' },
  { name: 'Tomat', variety: 'Servo F1', harvestDays: 75, icon: '🍅' },
  { name: 'Melon / Semangka', variety: 'Action 88', harvestDays: 65, icon: '🍉' },
  { name: 'Sayuran Daun', variety: 'Unggul', harvestDays: 30, icon: '🥬' },
  { name: 'Tanaman Buah', variety: 'Okulasi', harvestDays: 180, icon: '🥭' }
];

export const NewPlantingModal: React.FC<NewPlantingModalProps> = ({
  isOpen,
  onClose,
  onSavePlanting
}) => {
  const [cropName, setCropName] = useState<string>('Jagung');
  const [plotName, setPlotName] = useState<string>('');
  const [variety, setVariety] = useState<string>('NK 212');
  const [harvestDays, setHarvestDays] = useState<number>(100);
  const [scaleUnit, setScaleUnit] = useState<ScaleUnit>('m2');
  const [scaleQuantity, setScaleQuantity] = useState<number>(800);
  const [isCustomSqm, setIsCustomSqm] = useState<boolean>(false);
  const [customSqm, setCustomSqm] = useState<number>(800);
  const [plantingDate, setPlantingDate] = useState<string>(formatDate(new Date()));
  const [notes, setNotes] = useState<string>('');

  const currentUnitConfig = useMemo(() => {
    return SCALE_UNITS[scaleUnit] || SCALE_UNITS.m2;
  }, [scaleUnit]);

  // Handle quick crop selection chip
  const handleQuickCropSelect = (crop: typeof COMMON_CROPS[0]) => {
    setCropName(crop.name);
    setVariety(crop.variety);
    setHarvestDays(crop.harvestDays);
    if (!plotName) {
      setPlotName(`Lahan ${crop.name}`);
    }
  };

  // Handle unit change
  const handleUnitChange = (unit: ScaleUnit) => {
    setScaleUnit(unit);
    const cfg = SCALE_UNITS[unit];
    if (cfg) {
      setScaleQuantity(cfg.defaultQty);
    }
  };

  // Calculate equivalent sqm
  const effectiveAreaSqm = useMemo(() => {
    if (isCustomSqm) {
      return Number(customSqm) || 10;
    }
    const cropKey = cropName.toLowerCase().includes('cabai') ? 'cabai' : 
                    cropName.toLowerCase().includes('padi') ? 'padi' : 'jagung';
    return calculateEquivalentSqm(scaleQuantity, scaleUnit, cropKey);
  }, [isCustomSqm, customSqm, scaleQuantity, scaleUnit, cropName]);

  const estimatedHarvestDate = useMemo(() => {
    const days = Number(harvestDays) || 90;
    return addDays(plantingDate, days);
  }, [plantingDate, harvestDays]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName.trim() || !plantingDate) return;

    const finalPlotName = plotName.trim() || `Lahan ${cropName.trim()}`;
    const sanitizedCropId = cropName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30);

    const newPlanting: Planting = {
      id: generateUUID(),
      crop_id: sanitizedCropId,
      crop_name: cropName.trim(),
      variety: variety.trim() || 'Lokal',
      plot_name: finalPlotName,
      area_sqm: effectiveAreaSqm,
      scale_quantity: Number(scaleQuantity) || 1,
      scale_unit: scaleUnit,
      planting_date: plantingDate,
      estimated_harvest_date: estimatedHarvestDate,
      status: 'active',
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };

    onSavePlanting(newPlanting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
              🌱
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                Tambah Lahan / Tanaman Baru
              </h2>
              <p className="text-xs text-emerald-200">
                Data langsung tersimpan di Supabase • Bebas pilih jenis komoditas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Komoditas Tanaman (Free text + Quick chips) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              1. Nama Komoditas Tanaman
            </label>
            <input
              type="text"
              required
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="Ketik jenis tanaman, misal: Jagung, Cabai, Padi, Melon..."
              className="w-full text-base font-bold rounded-xl border border-stone-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-stone-500 self-center">Pilihan cepat:</span>
              {COMMON_CROPS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleQuickCropSelect(c)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                    cropName === c.name 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-stone-50 hover:bg-emerald-50 text-stone-700 border-stone-200'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Varietas & Nama Lahan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                Varietas Benih
              </label>
              <input
                type="text"
                required
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="Contoh: NK 212, Ori 212, Inpari 32, Lokal..."
                className="w-full text-sm font-semibold rounded-xl border border-stone-200 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Nama Plot / Lahan
              </label>
              <input
                type="text"
                value={plotName}
                onChange={(e) => setPlotName(e.target.value)}
                placeholder="Contoh: kangkungan, Petak A, Kebun Depan..."
                className="w-full text-sm font-semibold rounded-xl border border-stone-200 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Satuan & Skala Budidaya */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Trees className="w-4 h-4 text-emerald-600" />
                2. Satuan & Skala Budidaya
              </label>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {currentUnitConfig.icon} {scaleQuantity.toLocaleString('id-ID')} {currentUnitConfig.shortLabel} (~{effectiveAreaSqm.toLocaleString('id-ID')} m²)
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SCALE_UNIT_LIST.map((unitOpt) => {
                const isSelected = scaleUnit === unitOpt.id;
                return (
                  <button
                    key={unitOpt.id}
                    type="button"
                    onClick={() => handleUnitChange(unitOpt.id)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-stone-200 bg-stone-100/70 hover:bg-white text-stone-600'
                    }`}
                  >
                    <span className="text-lg">{unitOpt.icon}</span>
                    <span className="font-extrabold text-[11px] text-stone-900 mt-0.5">{unitOpt.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Kuantitas */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={scaleQuantity || ''}
                  onChange={(e) => setScaleQuantity(Number(e.target.value))}
                  className="w-full text-base font-black rounded-xl border border-stone-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  placeholder="Masukkan jumlah..."
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                  {currentUnitConfig.shortLabel}
                </span>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {currentUnitConfig.presets.slice(0, 3).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setScaleQuantity(preset)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer shrink-0 ${
                      scaleQuantity === preset
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-emerald-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tanggal Tanam & Estimasi Hari Panen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Tanggal Tanam (0 HST)
              </label>
              <input
                type="date"
                required
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full text-sm font-semibold rounded-xl border border-stone-200 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Estimasi Masa Panen (HST)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="15"
                  max="365"
                  required
                  value={harvestDays || ''}
                  onChange={(e) => setHarvestDays(Number(e.target.value))}
                  className="w-24 text-sm font-bold rounded-xl border border-stone-200 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="text-xs text-stone-500 font-semibold">Hari (~{estimatedHarvestDate})</span>
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Catatan Lahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pupuk dasar kandang 200 kg, jarak tanam 70x20 cm..."
              className="w-full text-xs sm:text-sm rounded-xl border border-stone-200 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              Simpan ke Supabase
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
