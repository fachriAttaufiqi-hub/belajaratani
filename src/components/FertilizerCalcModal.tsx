import React, { useState, useMemo } from 'react';
import { X, Calculator, Sprout, Check, Copy } from 'lucide-react';
import { DEFAULT_CROPS } from '../data/defaultCrops';

interface FertilizerCalcModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FertilizerCalcModal: React.FC<FertilizerCalcModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedCropId, setSelectedCropId] = useState<string>('padi');
  const [areaSqm, setAreaSqm] = useState<number>(2500); // 0.25 Ha
  const [copied, setCopied] = useState<boolean>(false);

  const selectedCrop = useMemo(() => {
    return DEFAULT_CROPS.find(c => c.id === selectedCropId) || DEFAULT_CROPS[0];
  }, [selectedCropId]);

  // Fertilizer calculation based on standard agronomic requirements per 10.000 m2 (1 Ha)
  const calc = useMemo(() => {
    const ratio = areaSqm / 10000;

    let ureaKg = 0;
    let npkKg = 0;
    let sp36Kg = 0;
    let kclKg = 0;
    let compostKg = 0;

    if (selectedCropId === 'padi') {
      ureaKg = Math.round(225 * ratio);
      npkKg = Math.round(275 * ratio);
      sp36Kg = Math.round(50 * ratio);
      compostKg = Math.round(2500 * ratio);
    } else if (selectedCropId === 'jagung') {
      ureaKg = Math.round(320 * ratio);
      npkKg = Math.round(220 * ratio);
      sp36Kg = Math.round(75 * ratio);
      compostKg = Math.round(2000 * ratio);
    } else if (selectedCropId === 'cabai') {
      ureaKg = Math.round(100 * ratio);
      npkKg = Math.round(400 * ratio); // NPK 16-16-16
      kclKg = Math.round(120 * ratio);
      compostKg = Math.round(6000 * ratio);
    } else if (selectedCropId === 'bawang_merah') {
      ureaKg = Math.round(120 * ratio);
      npkKg = Math.round(250 * ratio);
      kclKg = Math.round(100 * ratio);
      compostKg = Math.round(5000 * ratio);
    } else if (selectedCropId === 'tomat') {
      ureaKg = Math.round(80 * ratio);
      npkKg = Math.round(300 * ratio);
      kclKg = Math.round(100 * ratio);
      compostKg = Math.round(5000 * ratio);
    } else if (selectedCropId === 'kedelai') {
      ureaKg = Math.round(50 * ratio);
      npkKg = Math.round(100 * ratio);
      sp36Kg = Math.round(100 * ratio);
      kclKg = Math.round(75 * ratio);
      compostKg = Math.round(1500 * ratio);
    } else {
      // Semangka
      ureaKg = Math.round(100 * ratio);
      npkKg = Math.round(350 * ratio);
      kclKg = Math.round(150 * ratio);
      compostKg = Math.round(5000 * ratio);
    }

    // Estimated costs in IDR (approx subsidised / non-subsidised market prices)
    const ureaCost = ureaKg * 3500;
    const npkCost = npkKg * 6000;
    const sp36Cost = sp36Kg * 4000;
    const kclCost = kclKg * 9000;
    const compostCost = compostKg * 800;
    const totalCost = ureaCost + npkCost + sp36Cost + kclCost + compostCost;

    return {
      ratio,
      ureaKg,
      ureaBags: (ureaKg / 50).toFixed(1),
      npkKg,
      npkBags: (npkKg / 50).toFixed(1),
      sp36Kg,
      kclKg,
      compostKg,
      totalCost
    };
  }, [selectedCropId, areaSqm]);

  const handleCopySummary = () => {
    const text = `Rekomendasi Pupuk TaniGuide:
Komoditas: ${selectedCrop.name}
Luas Lahan: ${areaSqm.toLocaleString('id-ID')} m² (${(areaSqm / 10000).toFixed(2)} Ha)
-----------------------------
- Urea: ${calc.ureaKg} kg (~${calc.ureaBags} sak 50kg)
- NPK (Phonska/Mutiara): ${calc.npkKg} kg (~${calc.npkBags} sak 50kg)
${calc.sp36Kg > 0 ? `- SP-36 / Fosfat: ${calc.sp36Kg} kg\n` : ''}${calc.kclKg > 0 ? `- KCl / Kalium: ${calc.kclKg} kg\n` : ''}- Kompos/Kohe Matang: ${calc.compostKg} kg
-----------------------------
Estimasi Anggaran Pupuk: Rp ${calc.totalCost.toLocaleString('id-ID')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
              🧮
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold">Kalkulator Kebutuhan Pupuk</h2>
              <p className="text-xs text-emerald-200">Hitung dosis akurat berdasarkan luas lahan Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Pilih Komoditas Tanaman
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="w-full text-sm font-bold rounded-xl border border-stone-200 p-2.5 bg-stone-50 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {DEFAULT_CROPS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Land Area Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Luas Lahan Anda (m²)
              </label>
              <span className="text-xs font-bold text-emerald-700">
                = {(areaSqm / 10000).toFixed(2)} Hektar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                max="500000"
                step="50"
                value={areaSqm}
                onChange={(e) => setAreaSqm(Number(e.target.value))}
                className="flex-1 text-sm font-extrabold rounded-xl border border-stone-200 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              {/* Quick preset buttons */}
              <div className="flex gap-1">
                {[1000, 2500, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAreaSqm(preset)}
                    className="text-xs font-bold px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-emerald-100 text-stone-700 transition"
                  >
                    {preset === 10000 ? '1 Ha' : `${preset}m²`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-700" />
                Hasil Perhitungan Pupuk Berimbang
              </h4>
              <span className="text-xs font-black text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded-full">
                SOP Nasional
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-bold text-stone-500">Urea (Nitrogen)</span>
                <div className="text-lg font-black text-stone-900 mt-0.5">
                  {calc.ureaKg} <span className="text-xs font-semibold text-stone-500">kg</span>
                </div>
                <span className="text-[10px] text-stone-400 font-medium">~{calc.ureaBags} karung 50kg</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-bold text-stone-500">NPK (Phonska/Mutiara)</span>
                <div className="text-lg font-black text-stone-900 mt-0.5">
                  {calc.npkKg} <span className="text-xs font-semibold text-stone-500">kg</span>
                </div>
                <span className="text-[10px] text-stone-400 font-medium">~{calc.npkBags} karung 50kg</span>
              </div>

              {calc.sp36Kg > 0 && (
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500">SP-36 (Fosfat)</span>
                  <div className="text-lg font-black text-stone-900 mt-0.5">
                    {calc.sp36Kg} <span className="text-xs font-semibold text-stone-500">kg</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium">Tabur saat olah tanah</span>
                </div>
              )}

              {calc.kclKg > 0 && (
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[11px] font-bold text-stone-500">KCl / Kalium</span>
                  <div className="text-lg font-black text-stone-900 mt-0.5">
                    {calc.kclKg} <span className="text-xs font-semibold text-stone-500">kg</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium">Fase pembungaan & buah</span>
                </div>
              )}

              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs col-span-2">
                <span className="text-[11px] font-bold text-stone-500">Pupuk Kandang / Kompos Matang</span>
                <div className="text-lg font-black text-stone-900 mt-0.5">
                  {calc.compostKg.toLocaleString('id-ID')} <span className="text-xs font-semibold text-stone-500">kg ({(calc.compostKg / 1000).toFixed(1)} Ton)</span>
                </div>
                <span className="text-[10px] text-stone-400 font-medium">Wajib difermentasi sempurna sebelum ditabur</span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-950">
              <span>Perkiraan Anggaran Pupuk Total:</span>
              <span className="text-sm font-extrabold text-emerald-800">
                Rp {calc.totalCost.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleCopySummary}
              className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 font-bold text-xs text-stone-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Rekomendasi'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
