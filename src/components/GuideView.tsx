import React, { useState } from 'react';
import { 
  Layers, 
  Sprout, 
  Calendar, 
  ChevronRight, 
  Check, 
  Info, 
  Sparkles,
  ShieldAlert,
  Droplets,
  Plus
} from 'lucide-react';
import { DEFAULT_CROPS } from '../data/defaultCrops';
import { CropTemplate } from '../types';

interface GuideViewProps {
  onStartPlantingWithCrop: (cropId: string) => void;
  onOpenFertilizerCalc: () => void;
}

export const GuideView: React.FC<GuideViewProps> = ({
  onStartPlantingWithCrop,
  onOpenFertilizerCalc
}) => {
  const [selectedCrop, setSelectedCrop] = useState<CropTemplate>(DEFAULT_CROPS[0]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              Katalog & SOP Standar Budidaya Nasional
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {DEFAULT_CROPS.length} Komoditas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Panduan teknis Hari Setelah Tanam (HST), takaran pupuk dasar & susulan, pengendalian hama, dan kriteria panen prima.
          </p>
        </div>

        <button
          onClick={onOpenFertilizerCalc}
          className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm transition flex items-center gap-2"
        >
          <span>Hitung Kebutuhan Pupuk</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Crop List (4 Cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
            Pilih Komoditas
          </span>
          <div className="space-y-2">
            {DEFAULT_CROPS.map((crop) => {
              const isSelected = crop.id === selectedCrop.id;
              return (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop)}
                  className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center text-2xl shadow-2xs">
                      {crop.icon}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-stone-900 leading-snug">
                        {crop.name.split(' (')[0]}
                      </h4>
                      <p className="text-xs text-stone-500 italic mt-0.5">
                        {crop.latinName}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block mt-1">
                        Panen: ~{crop.harvestDaysMin}-{crop.harvestDaysMax} HST
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-stone-400'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed SOP View (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-6">
            
            {/* Top Detail Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl shadow-inner">
                  {selectedCrop.icon}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                    {selectedCrop.name}
                  </h2>
                  <p className="text-xs font-semibold text-emerald-700 italic">
                    {selectedCrop.latinName}
                  </p>
                  <p className="text-xs text-stone-500 mt-1 max-w-lg">
                    {selectedCrop.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onStartPlantingWithCrop(selectedCrop.id)}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Tanam Komoditas Ini
              </button>
            </div>

            {/* Varietas Rekomendasi & Dosis Pupuk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  Varietas Unggul Populer
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCrop.varietyExamples.map((v) => (
                    <span
                      key={v}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-800"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-emerald-700" />
                  Rekomendasi Pemupukan per Ha
                </span>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                  {selectedCrop.fertilizerGuide.chemicalPerHa}
                </p>
                <p className="text-[11px] text-emerald-800 font-semibold italic">
                  Organik: {selectedCrop.fertilizerGuide.organicPerHa}
                </p>
              </div>
            </div>

            {/* Stage Timeline Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Tahapan & Jadwal Hari Setelah Tanam (HST)
                </h3>
                <span className="text-xs font-bold text-stone-500">
                  {selectedCrop.standardStages.length} Titik Kritis SOP
                </span>
              </div>

              <div className="space-y-3">
                {selectedCrop.standardStages.map((stage, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-stone-200/90 bg-stone-50/50 hover:bg-white hover:border-emerald-300 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-stone-900 text-white">
                          {stage.hst} HST
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          stage.category === 'pemupukan' ? 'bg-amber-100 text-amber-800' :
                          stage.category === 'pengendalian_hama' ? 'bg-rose-100 text-rose-800' :
                          stage.category === 'penyiangan' ? 'bg-emerald-100 text-emerald-800' :
                          stage.category === 'penyiraman' ? 'bg-blue-100 text-blue-800' :
                          stage.category === 'panen' ? 'bg-teal-100 text-teal-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {stage.category.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900">
                          {stage.title}
                        </h4>
                      </div>

                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        stage.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-stone-200 text-stone-700'
                      }`}>
                        Prioritas {stage.priority}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {stage.description}
                    </p>

                    {stage.dosageRecommendation && (
                      <div className="text-[11px] font-semibold text-emerald-900 bg-emerald-100/60 px-2.5 py-1 rounded-lg inline-block border border-emerald-200">
                        🌿 Dosis: {stage.dosageRecommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
