import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Layers, 
  Check, 
  Sprout, 
  Info,
  Trees,
  SlidersHorizontal
} from 'lucide-react';
import { DEFAULT_CROPS } from '../data/defaultCrops';
import { Planting, ScaleUnit } from '../types';
import { addDays, formatDate, generateUUID } from '../lib/storage';
import { SCALE_UNITS, SCALE_UNIT_LIST, calculateEquivalentSqm } from '../lib/scaleUnits';

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
  const [selectedCropId, setSelectedCropId] = useState<string>('cabai');
  const [plotName, setPlotName] = useState<string>('Kebun Cabai 50 Pohon');
  const [variety, setVariety] = useState<string>('Ori 212');
  const [scaleUnit, setScaleUnit] = useState<ScaleUnit>('pohon');
  const [scaleQuantity, setScaleQuantity] = useState<number>(50);
  const [isCustomSqm, setIsCustomSqm] = useState<boolean>(false);
  const [customSqm, setCustomSqm] = useState<number>(50);
  const [plantingDate, setPlantingDate] = useState<string>(formatDate(new Date()));
  const [notes, setNotes] = useState<string>('');

  const selectedCrop = useMemo(() => {
    return DEFAULT_CROPS.find(c => c.id === selectedCropId) || DEFAULT_CROPS[0];
  }, [selectedCropId]);

  const currentUnitConfig = useMemo(() => {
    return SCALE_UNITS[scaleUnit] || SCALE_UNITS.pohon;
  }, [scaleUnit]);

  // Handle crop change, auto update default variety and suggest appropriate unit
  const handleCropChange = (cropId: string) => {
    setSelectedCropId(cropId);
    const crop = DEFAULT_CROPS.find(c => c.id === cropId);
    if (crop && crop.varietyExamples.length > 0) {
      setVariety(crop.varietyExamples[0]);
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
    return calculateEquivalentSqm(scaleQuantity, scaleUnit, selectedCrop.id);
  }, [isCustomSqm, customSqm, scaleQuantity, scaleUnit, selectedCrop.id]);

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
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-800 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
              🌱
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Tambah Lahan / Tanaman Baru
              </h2>
              <p className="text-xs text-emerald-200">
                Mendukung skala pohon/batang, polybag pekarangan, bedengan, hingga hamparan hektar
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
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

          {/* Step 2: Satuan & Skala Budidaya (Pohon, Polybag, m², Ha, Bedeng, Ru) */}
          <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Trees className="w-4 h-4 text-emerald-600" />
                  2. Pilih Satuan Skala Budidaya
                </label>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Fleksibel Skala Kecil & Luas
                </span>
              </div>
              <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                Pilih apakah budidaya dihitung per <strong>Pohon/Batang</strong> (tanaman skala kecil, buah, pekarangan), <strong>Polybag/Pot</strong>, atau berdasarkan <strong>Luas Lahan (m²/Ha)</strong>:
              </p>

              {/* Group 1: Skala Kuantitas Tanaman (Skala Kecil) */}
              <div className="space-y-1.5 mb-3">
                <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🌳</span>
                  <span>Skala Tanaman Kecil / Pohon / Pekarangan</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SCALE_UNIT_LIST.filter(u => u.category === 'plant').map((unitOpt) => {
                    const isSelected = scaleUnit === unitOpt.id;
                    return (
                      <button
                        key={unitOpt.id}
                        type="button"
                        onClick={() => handleUnitChange(unitOpt.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-stone-200 bg-stone-100/70 hover:bg-white text-stone-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{unitOpt.icon}</span>
                          {isSelected && (
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="mt-1">
                          <div className="font-extrabold text-xs text-stone-900">
                            {unitOpt.shortLabel}
                          </div>
                          <div className="text-[10px] text-stone-500 leading-tight line-clamp-1 mt-0.5">
                            {unitOpt.categoryLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Skala Luas Lahan */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🚜</span>
                  <span>Skala Luas Lahan / Hamparan</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SCALE_UNIT_LIST.filter(u => u.category === 'area').map((unitOpt) => {
                    const isSelected = scaleUnit === unitOpt.id;
                    return (
                      <button
                        key={unitOpt.id}
                        type="button"
                        onClick={() => handleUnitChange(unitOpt.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-stone-200 bg-stone-100/70 hover:bg-white text-stone-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{unitOpt.icon}</span>
                          {isSelected && (
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="mt-1">
                          <div className="font-extrabold text-xs text-stone-900">
                            {unitOpt.shortLabel}
                          </div>
                          <div className="text-[10px] text-stone-500 leading-tight line-clamp-1 mt-0.5">
                            {unitOpt.categoryLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Input Kuantitas Jumlah & Preset */}
            <div className="bg-white p-4 rounded-xl border border-stone-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                    Jumlah {currentUnitConfig.shortLabel}:
                  </label>
                  <p className="text-[11px] text-stone-500">
                    {currentUnitConfig.description}
                  </p>
                </div>
                
                {/* Equivalent badge */}
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-xs">
                    {currentUnitConfig.icon} {scaleQuantity.toLocaleString('id-ID')} {currentUnitConfig.shortLabel}
                    <span className="text-stone-400 font-normal">•</span>
                    <span className="text-stone-700">~{effectiveAreaSqm.toLocaleString('id-ID')} m²</span>
                  </span>
                </div>
              </div>

              {/* Number Input & Presets */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={currentUnitConfig.min}
                    max={currentUnitConfig.max}
                    step={currentUnitConfig.step}
                    required
                    value={scaleQuantity || ''}
                    onChange={(e) => setScaleQuantity(Number(e.target.value))}
                    className="w-full text-base font-black rounded-xl border border-stone-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder={currentUnitConfig.placeholder}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                    {currentUnitConfig.shortLabel}
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {currentUnitConfig.presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setScaleQuantity(preset)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer shrink-0 ${
                        scaleQuantity === preset
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900'
                      }`}
                    >
                      {preset} {currentUnitConfig.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Custom Sqm Toggle */}
              {scaleUnit !== 'm2' && (
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600 flex-wrap gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={isCustomSqm}
                      onChange={(e) => {
                        setIsCustomSqm(e.target.checked);
                        if (e.target.checked) setCustomSqm(effectiveAreaSqm);
                      }}
                      className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Sesuaikan estimasi luas fisik tanah secara manual</span>
                  </label>

                  {isCustomSqm && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="1000000"
                        value={customSqm}
                        onChange={(e) => setCustomSqm(Number(e.target.value))}
                        className="w-24 text-xs font-bold rounded-lg border border-stone-300 px-2.5 py-1"
                      />
                      <span className="font-bold text-stone-700">m²</span>
                    </div>
                  )}
                </div>
              )}

              {/* Small-scale unit explanation box */}
              {currentUnitConfig.category === 'plant' && (
                <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
                  <span className="text-base shrink-0">💡</span>
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-emerald-900">
                      Budidaya Tanaman Skala Kecil ({currentUnitConfig.shortLabel})
                    </p>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Sistem akan menyesuaikan takaran SOP pemupukan, penyiraman rutin, dan estimasi biaya secara langsung per <strong>{currentUnitConfig.shortLabel.toLowerCase()}</strong> tanpa mengharuskan Anda melakukan konversi luas hektar yang rumit.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Detail Lahan & Tanggal Tanam */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              3. Identitas Lahan & Jadwal Tanam
            </label>
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
                  placeholder="Contoh: Kebun Cabai 50 Pohon, Sawah Petak Barat"
                  className="w-full text-sm font-semibold rounded-xl border border-stone-200 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Varietas Benih */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  Varietas Benih
                </label>
                <input
                  type="text"
                  required
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="Contoh: Inpari 32, NK 212, Ori 212"
                  className="w-full text-sm font-semibold rounded-xl border border-stone-200 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
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

              {/* Ringkasan Skala */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Target Estimasi Panen:</span>
                <span className="text-sm font-extrabold text-stone-900 mt-0.5">
                  {estimatedHarvestDate}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  ~{selectedCrop.harvestDaysMax} Hari Setelah Tanam (HST)
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
              placeholder="Contoh: Media tanam sekam bakar + kohe kambing 1:1, pengocoran NPK interval 10 hari."
              className="w-full text-xs sm:text-sm rounded-xl border border-stone-200 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Step 4: Preview Timeline Otomatis yang Dihasilkan */}
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

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
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
