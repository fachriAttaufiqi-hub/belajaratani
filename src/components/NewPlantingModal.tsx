import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Layers, 
  Check, 
  Clock, 
  Sprout, 
  ChevronRight,
  Info
} from 'lucide-react';
import { DEFAULT_CROPS } from '../data/defaultCrops';
import { Planting } from '../types';
import { addDays, formatDate, generateUUID } from '../lib/storage';

interface NewPlantingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlanting: (planting: Planting) => void;
}

export const NewPlantingModal: React.FC<NewPlantingModalProps> = ({
  isOpen,
  onClose,
  onSavePlanting
}) => {
  const [selectedCropId, setSelectedCropId] = useState<string>('jagung');
  const [plotName, setPlotName] = useState<string>('Lahan Sawah Blok Baru');
  const [variety, setVariety] = useState<string>('NK 212');
  const [areaSqm, setAreaSqm] = useState<number>(2000);
  const [plantingDate, setPlantingDate] = useState<string>(formatDate(new Date()));
  const [notes, setNotes] = useState<string>('');

  const selectedCrop = useMemo(() => {
    return DEFAULT_CROPS.find(c => c.id === selectedCropId) || DEFAULT_CROPS[0];
  }, [selectedCropId]);

  // Handle crop change, auto update default variety
  const handleCropChange = (cropId: string) => {
    setSelectedCropId(cropId);
    const crop = DEFAULT_CROPS.find(c => c.id === cropId);
    if (crop && crop.varietyExamples.length > 0) {
      setVariety(crop.varietyExamples[0]);
    }
  };

  // Preview generated timeline
  const previewStages = useMemo(() => {
    if (!selectedCrop) return [];
    return selectedCrop.standardStages.map(stage => {
      const calculatedDate = addDays(plantingDate, stage.hst);
      return {
        ...stage,
        calculatedDate
      };
    });
  }, [selectedCrop, plantingDate]);

  const estimatedHarvestDate = useMemo(() => {
    if (!selectedCrop) return plantingDate;
    return addDays(plantingDate, selectedCrop.harvestDaysMax);
  }, [selectedCrop, plantingDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plotName.trim() || !plantingDate) return;

    const newPlanting: Planting = {
      id: generateUUID(),
      crop_id: selectedCrop.id,
      crop_name: selectedCrop.name,
      variety: variety.trim() || selectedCrop.varietyExamples[0] || 'Lokal',
      plot_name: plotName.trim(),
      area_sqm: Number(areaSqm) || 1000,
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
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-800 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
              🌱
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Generator Jadwal & Lahan Baru
              </h2>
              <p className="text-xs text-emerald-200">
                Pilih komoditas & tanggal tanam untuk pembuatan otomatis jadwal HST
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Step 1: Pilih Komoditas */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              1. Pilih Jenis Komoditas Pertanian
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DEFAULT_CROPS.map((crop) => {
                const isSelected = crop.id === selectedCropId;
                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => handleCropChange(crop.id)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{crop.icon}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 leading-snug">
                        {crop.name.split(' (')[0]}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-medium mt-0.5">
                        Panen: ~{crop.harvestDaysMin}-{crop.harvestDaysMax} HST
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Detail Lahan & Tanggal Tanam */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nama Lahan */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Nama Plot / Lahan
              </label>
              <input
                type="text"
                required
                value={plotName}
                onChange={(e) => setPlotName(e.target.value)}
                placeholder="Contoh: Sawah Petak Timur, Kebun Belakang"
                className="w-full text-sm font-semibold rounded-xl border border-stone-200 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Varietas Benih */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                Varietas Benih
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="Contoh: Inpari 32, NK 212, Ori 212"
                  className="w-full text-sm font-semibold rounded-xl border border-stone-200 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="text-[10px] text-stone-500">Saran:</span>
                {selectedCrop.varietyExamples.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariety(v)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-800 transition cursor-pointer"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanggal Tanam */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
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

            {/* Luas Lahan (m2) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Luas Lahan (m²)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="1000000"
                  step="10"
                  required
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(Number(e.target.value))}
                  className="w-full text-sm font-semibold rounded-xl border border-stone-200 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                  {((areaSqm || 0) / 10000).toFixed(2)} Ha
                </span>
              </div>
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Catatan Lahan / Persiapan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Telah diberi dolomit 100 kg saat olah tanah 2 minggu lalu."
              className="w-full text-xs sm:text-sm rounded-xl border border-stone-200 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Step 3: Preview Timeline Otomatis yang Dihasilkan */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Pratinjau Jadwal Otomatis ({previewStages.length} Tahapan Dibuat)
                </h4>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Panen Est: {estimatedHarvestDate}
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {previewStages.map((stage, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700">
                      {stage.hst} HST
                    </span>
                    <span className="font-bold text-stone-900 truncate">
                      {stage.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                    {stage.calculatedDate}
                  </span>
                </div>
              ))}
            </div>
            
            <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              Jadwal di atas otomatis masuk ke Checklist harian Anda dan dapat diedit atau ditambah kapan saja.
            </p>
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
              Buat Jadwal Otomatis & Simpan
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
