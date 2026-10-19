import React, { useState, useMemo } from 'react';
import { X, Calculator, Sprout, Check, Copy, Trees, Sparkles } from 'lucide-react';
import { DEFAULT_CROPS } from '../data/defaultCrops';
import { ScaleUnit } from '../types';
import { calculateEquivalentSqm } from '../lib/scaleUnits';

interface FertilizerCalcModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FertilizerCalcModal: React.FC<FertilizerCalcModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedCropId, setSelectedCropId] = useState<string>('cabai');
  const [calcMode, setCalcMode] = useState<'pohon' | 'polybag' | 'lubang' | 'area'>('pohon');
  const [plantCount, setPlantCount] = useState<number>(50);
  const [areaSqm, setAreaSqm] = useState<number>(2000);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedCrop = useMemo(() => {
    return DEFAULT_CROPS.find(c => c.id === selectedCropId) || DEFAULT_CROPS[0];
  }, [selectedCropId]);

  // Determine effective square meters for fertilizer calculation
  const effectiveSqm = useMemo(() => {
    if (calcMode === 'pohon') {
      return calculateEquivalentSqm(plantCount, 'pohon', selectedCropId);
    }
    if (calcMode === 'polybag') {
      return calculateEquivalentSqm(plantCount, 'polybag', selectedCropId);
    }
    if (calcMode === 'lubang') {
      return calculateEquivalentSqm(plantCount, 'lubang_tanam', selectedCropId);
    }
    return areaSqm;
  }, [calcMode, plantCount, areaSqm, selectedCropId]);

  // Fertilizer calculation based on standard agronomic requirements per plant or per Ha
  const calc = useMemo(() => {
    const isSmallScaleMode = calcMode !== 'area';
    const ratio = Math.max(0.0001, effectiveSqm / 10000);

    let baseUreaPerHa = 0;
    let baseNpkPerHa = 0;
    let baseSp36PerHa = 0;
    let baseKclPerHa = 0;
    let baseCompostPerHa = 0;

    // Per-plant dosage recommendation (gram per pohon / polybag)
    let perPlantNpkGram = 10;
    let perPlantCompostKg = 1.0;
    let applicationMethod = 'Kocor larutan 200 ml atau tugal 7 cm dari pangkal batang';

    if (selectedCropId === 'padi') {
      baseUreaPerHa = 225;
      baseNpkPerHa = 275;
      baseSp36PerHa = 50;
      baseCompostPerHa = 2500;
      perPlantNpkGram = 3;
      perPlantCompostKg = 0.2;
      applicationMethod = 'Sebar merata saat macak-macak';
    } else if (selectedCropId === 'jagung') {
      baseUreaPerHa = 320;
      baseNpkPerHa = 220;
      baseSp36PerHa = 75;
      baseCompostPerHa = 2000;
      perPlantNpkGram = 15;
      perPlantCompostKg = 0.5;
      applicationMethod = 'Tugal di samping tanaman jarak 7 cm lalu tutup tanah';
    } else if (selectedCropId === 'cabai') {
      baseUreaPerHa = 100;
      baseNpkPerHa = 400; // NPK 16-16-16
      baseKclPerHa = 120;
      baseCompostPerHa = 6000;
      perPlantNpkGram = 10;
      perPlantCompostKg = 1.0;
      applicationMethod = 'Kocor larutan 3-5 gram/liter air (200-250 ml per pohon) tiap 10-14 hari';
    } else if (selectedCropId === 'bawang_merah') {
      baseUreaPerHa = 120;
      baseNpkPerHa = 250;
      baseKclPerHa = 100;
      baseCompostPerHa = 5000;
      perPlantNpkGram = 5;
      perPlantCompostKg = 0.3;
      applicationMethod = 'Tabur di sela larikan bedengan lalu siram';
    } else if (selectedCropId === 'tomat') {
      baseUreaPerHa = 80;
      baseNpkPerHa = 300;
      baseKclPerHa = 100;
      baseCompostPerHa = 5000;
      perPlantNpkGram = 12;
      perPlantCompostKg = 1.5;
      applicationMethod = 'Kocor NPK + kalsium interval 10-14 hari sekali';
    } else if (selectedCropId === 'kedelai') {
      baseUreaPerHa = 50;
      baseNpkPerHa = 100;
      baseSp36PerHa = 100;
      baseKclPerHa = 75;
      baseCompostPerHa = 1500;
      perPlantNpkGram = 5;
      perPlantCompostKg = 0.2;
      applicationMethod = 'Tugal pupuk berjarak 5 cm dari bibit';
    } else {
      // Semangka / Melon
      baseUreaPerHa = 100;
      baseNpkPerHa = 350;
      baseKclPerHa = 150;
      baseCompostPerHa = 5000;
      perPlantNpkGram = 25;
      perPlantCompostKg = 2.0;
      applicationMethod = 'Kocor bertahap di bawah lubang mulsa (300 ml per batang)';
    }

    // Calculations in kg (or grams for small scale)
    let npkKg = 0;
    let ureaKg = 0;
    let compostKg = 0;
    let sp36Kg = 0;
    let kclKg = 0;

    if (isSmallScaleMode) {
      npkKg = Number(((plantCount * perPlantNpkGram) / 1000).toFixed(2));
      ureaKg = Number(((plantCount * (perPlantNpkGram * 0.4)) / 1000).toFixed(2));
      compostKg = Number((plantCount * perPlantCompostKg).toFixed(1));
      kclKg = Number(((plantCount * (perPlantNpkGram * 0.25)) / 1000).toFixed(2));
      sp36Kg = Number(((plantCount * (perPlantNpkGram * 0.15)) / 1000).toFixed(2));
    } else {
      ureaKg = Number((baseUreaPerHa * ratio).toFixed(2));
      npkKg = Number((baseNpkPerHa * ratio).toFixed(2));
      sp36Kg = Number((baseSp36PerHa * ratio).toFixed(2));
      kclKg = Number((baseKclPerHa * ratio).toFixed(2));
      compostKg = Number((baseCompostPerHa * ratio).toFixed(1));
    }

    // Estimated costs in IDR
    const ureaCost = Math.round(ureaKg * 3500);
    const npkCost = Math.round(npkKg * 6000);
    const sp36Cost = Math.round(sp36Kg * 4000);
    const kclCost = Math.round(kclKg * 9000);
    const compostCost = Math.round(compostKg * 800);
    const totalCost = ureaCost + npkCost + sp36Cost + kclCost + compostCost;

    return {
      ratio,
      isSmallScaleMode,
      ureaKg,
      ureaBags: (ureaKg / 50).toFixed(1),
      npkKg,
      npkBags: (npkKg / 50).toFixed(1),
      sp36Kg,
      kclKg,
      compostKg,
      totalCost,
      perPlantNpkGram,
      perPlantCompostKg,
      applicationMethod
    };
  }, [selectedCropId, effectiveSqm, calcMode, plantCount]);

  const handleCopySummary = () => {
    let scaleLabel = '';
    if (calcMode === 'pohon') {
      scaleLabel = `Skala: ${plantCount} Pohon / Batang (~${effectiveSqm} m²)`;
    } else if (calcMode === 'polybag') {
      scaleLabel = `Skala: ${plantCount} Polybag / Pot (~${effectiveSqm} m²)`;
    } else if (calcMode === 'lubang') {
      scaleLabel = `Skala: ${plantCount} Lubang Tanam (~${effectiveSqm} m²)`;
    } else {
      scaleLabel = `Luas Lahan: ${areaSqm.toLocaleString('id-ID')} m² (${(areaSqm / 10000).toFixed(2)} Ha)`;
    }

    const text = `Rekomendasi Pupuk TaniGuide:
Komoditas: ${selectedCrop.name}
${scaleLabel}
-----------------------------
- NPK (Phonska/Mutiara): ${calc.npkKg >= 1 ? `${calc.npkKg} kg` : `${Math.round(calc.npkKg * 1000)} gram`}
- Urea: ${calc.ureaKg >= 1 ? `${calc.ureaKg} kg` : `${Math.round(calc.ureaKg * 1000)} gram`}
${calc.sp36Kg > 0 ? `- SP-36: ${calc.sp36Kg >= 1 ? `${calc.sp36Kg} kg` : `${Math.round(calc.sp36Kg * 1000)} gram`}\n` : ''}${calc.kclKg > 0 ? `- KCl: ${calc.kclKg >= 1 ? `${calc.kclKg} kg` : `${Math.round(calc.kclKg * 1000)} gram`}\n` : ''}- Kompos/Kandang Matang: ${calc.compostKg} kg
Takaran: ~${calc.perPlantNpkGram} gram per pohon (${calc.applicationMethod})
-----------------------------
Estimasi Anggaran Pupuk: Rp ${calc.totalCost.toLocaleString('id-ID')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl border border-white/20">
              🧮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">
                  Kalkulator Dosis Pupuk Presisi
                </h2>
                <span className="text-[10px] font-bold bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full">
                  Skala Pohon & Lahan
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Hitung takaran presisi untuk satuan pohon, polybag, lubang tanam, maupun luas lahan
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

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              1. Pilih Komoditas Tanaman
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="w-full text-sm font-bold rounded-xl border border-stone-300 p-2.5 bg-stone-50 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {DEFAULT_CROPS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Mode Tabs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                2. Pilih Satuan Skala
              </label>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Mendukung Satuan Pohon
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCalcMode('pohon')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                  calcMode === 'pohon'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className="text-base">🌳</span>
                <span className="leading-tight">Satuan Pohon</span>
              </button>

              <button
                type="button"
                onClick={() => setCalcMode('polybag')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                  calcMode === 'polybag'
                    ? 'bg-teal-50 border-teal-600 text-teal-950 ring-2 ring-teal-500/20'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className="text-base">🪴</span>
                <span className="leading-tight">Polybag / Pot</span>
              </button>

              <button
                type="button"
                onClick={() => setCalcMode('lubang')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                  calcMode === 'lubang'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className="text-base">🔘</span>
                <span className="leading-tight">Lubang Tanam</span>
              </button>

              <button
                type="button"
                onClick={() => setCalcMode('area')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                  calcMode === 'area'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className="text-base">📐</span>
                <span className="leading-tight">Luas (m² / Ha)</span>
              </button>
            </div>
          </div>

          {/* Quantity Input based on mode */}
          {calcMode === 'pohon' && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-stone-800 flex items-center gap-1">
                  <span>🌳</span>
                  <span>Jumlah Pohon / Batang:</span>
                </label>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                  ~{effectiveSqm.toLocaleString('id-ID')} m² ekuivalen
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="50000"
                  value={plantCount}
                  onChange={(e) => setPlantCount(Math.max(1, Number(e.target.value)))}
                  className="flex-1 text-base font-black rounded-xl border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="text-xs font-bold text-stone-500">Pohon</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[10, 25, 50, 100, 250, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPlantCount(preset)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      plantCount === preset
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {preset} Pohon
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-stone-500 italic">
                Dosis akan dihitung langsung per pohon (misal ~{calc.perPlantNpkGram} gram NPK / pohon), sangat cocok untuk budidaya skala kecil dan kebun pekarangan.
              </p>
            </div>
          )}

          {calcMode === 'polybag' && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-stone-800 flex items-center gap-1">
                  <span>🪴</span>
                  <span>Jumlah Polybag / Pot:</span>
                </label>
                <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-md">
                  ~{effectiveSqm.toLocaleString('id-ID')} m² ekuivalen
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="20000"
                  value={plantCount}
                  onChange={(e) => setPlantCount(Math.max(1, Number(e.target.value)))}
                  className="flex-1 text-base font-black rounded-xl border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                <span className="text-xs font-bold text-stone-500">Polybag</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[15, 30, 50, 100, 200, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPlantCount(preset)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      plantCount === preset
                        ? 'bg-teal-600 text-white'
                        : 'bg-white hover:bg-teal-50 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {preset} Polybag
                  </button>
                ))}
              </div>
            </div>
          )}

          {calcMode === 'lubang' && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-stone-800 flex items-center gap-1">
                  <span>🔘</span>
                  <span>Jumlah Lubang Tanam (Mulsa):</span>
                </label>
                <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                  ~{effectiveSqm.toLocaleString('id-ID')} m² ekuivalen
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={plantCount}
                  onChange={(e) => setPlantCount(Math.max(10, Number(e.target.value)))}
                  className="flex-1 text-base font-black rounded-xl border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-xs font-bold text-stone-500">Lubang</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[100, 250, 500, 1000, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPlantCount(preset)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      plantCount === preset
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white hover:bg-indigo-50 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {preset} Lubang
                  </button>
                ))}
              </div>
            </div>
          )}

          {calcMode === 'area' && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-stone-800">
                  Luas Lahan (m²):
                </label>
                <span className="text-xs font-bold text-emerald-800">
                  = {(areaSqm / 10000).toFixed(2)} Hektar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="500000"
                  step="50"
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(Math.max(10, Number(e.target.value)))}
                  className="flex-1 text-base font-black rounded-xl border border-stone-300 p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="text-xs font-bold text-stone-500">m²</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[500, 1000, 2500, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAreaSqm(preset)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      areaSqm === preset
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {preset === 10000 ? '1 Ha' : `${preset} m²`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-700" />
                Dosis Kebutuhan Pupuk
              </h4>
              <span className="text-[11px] font-black text-emerald-900 bg-emerald-200/80 px-2.5 py-0.5 rounded-full">
                {calcMode === 'pohon' ? `${plantCount} Pohon` : calcMode === 'polybag' ? `${plantCount} Polybag` : calcMode === 'lubang' ? `${plantCount} Lubang` : `${areaSqm.toLocaleString('id-ID')} m²`}
              </span>
            </div>

            {/* Quick dosage instruction banner */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
              <div className="font-extrabold text-emerald-950 flex items-center gap-1">
                <span>💡 Rekomendasi Takaran per {calcMode === 'pohon' ? 'Pohon' : calcMode === 'polybag' ? 'Polybag' : calcMode === 'lubang' ? 'Lubang Tanam' : 'Tanaman'}:</span>
              </div>
              <p className="text-stone-700 text-[11px] leading-relaxed">
                ~<strong>{calc.perPlantNpkGram} gram</strong> NPK per {calcMode === 'pohon' ? 'pohon' : calcMode === 'polybag' ? 'polybag' : 'titik tanam'} ({calc.applicationMethod})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-bold text-stone-500">NPK (Phonska / Mutiara)</span>
                <div className="text-lg font-black text-emerald-800 mt-0.5">
                  {calc.npkKg >= 1 ? `${calc.npkKg} kg` : `${Math.round(calc.npkKg * 1000)} gram`}
                </div>
                <span className="text-[10px] text-stone-400 font-medium">Pupuk utama pertumbuhan</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-bold text-stone-500">Urea (Nitrogen)</span>
                <div className="text-lg font-black text-stone-900 mt-0.5">
                  {calc.ureaKg >= 1 ? `${calc.ureaKg} kg` : `${Math.round(calc.ureaKg * 1000)} gram`}
                </div>
                <span className="text-[10px] text-stone-400 font-medium">Vegetatif tunas & daun</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-bold text-stone-500">Pupuk Kandang / Kompos</span>
                <div className="text-lg font-black text-amber-800 mt-0.5">
                  {calc.compostKg} kg
                </div>
                <span className="text-[10px] text-stone-400 font-medium">Bahan organik & biologi tanah</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-bold text-stone-500">Estimasi Belanja Pupuk</span>
                <div className="text-lg font-black text-emerald-700 mt-0.5">
                  Rp {calc.totalCost.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-stone-400 font-medium">Harga acuan rata-rata toko tani</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin!' : 'Salin Rekomendasi'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer"
          >
            Tutup Kalkulator
          </button>
        </div>

      </div>
    </div>
  );
};
