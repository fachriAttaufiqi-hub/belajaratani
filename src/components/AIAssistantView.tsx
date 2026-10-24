import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Calendar, 
  Sprout, 
  Droplets, 
  Bug, 
  Scissors, 
  Check, 
  Copy, 
  RotateCcw, 
  Plus, 
  ChevronRight, 
  Info, 
  AlertCircle,
  HelpCircle,
  Clock,
  MapPin,
  Trees,
  CheckCircle2,
  CalendarCheck2,
  ShieldCheck
} from 'lucide-react';
import { Planting, TaskItem } from '../types';
import { calculateHST, formatDate, addDays, generateUUID } from '../lib/storage';
import { formatPlantingScale } from '../lib/scaleUnits';
import { sendAIChatMessage, generateAITasks, ChatMessage, GeneratedAITask } from '../lib/aiAssistant';

interface AIAssistantViewProps {
  plantings: Planting[];
  tasks: TaskItem[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  onAddTask?: (task: TaskItem) => Promise<any> | void;
  onNavigateToSchedule?: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  plantings,
  tasks,
  selectedPlotId,
  onSelectPlot,
  onAddTask,
  onNavigateToSchedule
}) => {
  const [activePlotId, setActivePlotId] = useState<string>(selectedPlotId);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Task Generator Modal State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState<boolean>(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedAITask[]>([]);
  const [addedTaskIndices, setAddedTaskIndices] = useState<number[]>([]);
  const [generatorSuccessMessage, setGeneratorSuccessMessage] = useState<string | null>(null);

  const activePlot = useMemo(() => {
    if (activePlotId === 'all') return null;
    return plantings.find(p => p.id === activePlotId) || null;
  }, [plantings, activePlotId]);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-msg',
        role: 'model',
        text: `Salam Tani! 🌱 Saya **Asisten AI TaniGuide**, konsultan agronomi digital Anda.\n\nSaya siap membantu Anda menyusun **jadwal perawatan terstruktur (HST)** dan memberikan **langkah perawatan tanaman yang baik**, seperti:\n* 🗓️ **Timeline Perawatan HST**: Kapan waktu terbaik pemupukan, wiwil tunas, dan penyiraman.\n* 🧪 **Dosis Pupuk Berimbang**: Takaran presisi untuk skala **Pohon/Batang/Polybag** maupun hektar.\n* 🐛 **Pengendalian Hama & Penyakit**: Solusi cepat mengatasi daun keriting, kuning, busuk buah, atau kutu kebul.\n* 💧 **Manajemen Air & Panen**: Kapan fase kritis air dan kapan harus pengeringan sebelum panen.\n\nSilakan pilih lahan aktif Anda di atas atau tanyakan langsung pertanyaan seputar kebun Anda!`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Sync active plot if external prop changes
  useEffect(() => {
    setActivePlotId(selectedPlotId);
  }, [selectedPlotId]);

  const activePlotHst = activePlot ? calculateHST(activePlot.planting_date) : 0;
  const activePlotScale = activePlot ? formatPlantingScale(activePlot) : null;
  const activePlotTasks = activePlot ? tasks.filter(t => t.planting_id === activePlot.id) : [];
  const pendingTasks = activePlotTasks.filter(t => !t.is_completed).map(t => `${t.title} (${t.hst} HST)`);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    const plotContext = activePlot ? {
      plot_name: activePlot.plot_name,
      crop_name: activePlot.crop_name,
      variety: activePlot.variety,
      hst: activePlotHst,
      scale_quantity: activePlot.scale_quantity,
      scale_unit: activePlot.scale_unit,
      area_sqm: activePlot.area_sqm,
      planting_date: activePlot.planting_date,
      estimated_harvest_date: activePlot.estimated_harvest_date,
      pending_tasks: pendingTasks.slice(0, 5)
    } : undefined;

    const historyPayload = messages
      .filter(m => m.id !== 'welcome-msg')
      .slice(-6)
      .map(m => ({
        role: m.role,
        text: m.text
      }));

    const res = await sendAIChatMessage(textToSend.trim(), plotContext, historyPayload);

    setIsLoading(false);

    if (res.success && res.reply) {
      const modelMsg: ChatMessage = {
        id: generateUUID(),
        role: 'model',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, modelMsg]);
    } else {
      const errorMsg: ChatMessage = {
        id: generateUUID(),
        role: 'model',
        text: `⚠️ **Maaf, ada kendala saat menghubungi asisten AI:**\n${res.error || 'Silakan periksa koneksi internet atau coba kembali beberapa saat lagi.'}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: generateUUID(),
        role: 'model',
        text: `Percakapan telah direset. Ada yang bisa saya bantu terkait jadwal atau langkah perawatan tanaman Anda hari ini? 🌱`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Generate automated task checklist with AI
  const handleOpenGenerator = () => {
    setIsGeneratorOpen(true);
    setGeneratedTasks([]);
    setAddedTaskIndices([]);
    setGeneratorSuccessMessage(null);
  };

  const handleRunTaskGenerator = async () => {
    if (!activePlot) return;
    setIsGeneratingTasks(true);
    setGeneratorSuccessMessage(null);

    const res = await generateAITasks(
      activePlot.crop_name,
      activePlot.variety,
      activePlot.scale_quantity,
      activePlot.scale_unit,
      activePlot.planting_date
    );

    setIsGeneratingTasks(false);
    if (res.success && res.tasks) {
      setGeneratedTasks(res.tasks);
    }
  };

  const handleAddSingleTaskToSchedule = async (genTask: GeneratedAITask, index: number) => {
    if (!activePlot || !onAddTask) return;

    const dueDate = addDays(activePlot.planting_date, genTask.hst);
    const currentHst = calculateHST(activePlot.planting_date);

    const newTask: TaskItem = {
      id: generateUUID(),
      planting_id: activePlot.id,
      title: genTask.title,
      category: genTask.category,
      hst: genTask.hst,
      due_date: dueDate,
      dosage: genTask.dosage,
      description: genTask.description,
      priority: genTask.priority || 'medium',
      is_completed: genTask.hst < currentHst - 3,
      completed_at: genTask.hst < currentHst - 3 ? dueDate : null
    };

    await onAddTask(newTask);
    setAddedTaskIndices(prev => [...prev, index]);
    setGeneratorSuccessMessage(`Tugas "${genTask.title}" berhasil ditambahkan ke jadwal lahan!`);
  };

  const handleAddAllTasksToSchedule = async () => {
    if (!activePlot || !onAddTask || generatedTasks.length === 0) return;

    for (let i = 0; i < generatedTasks.length; i++) {
      if (!addedTaskIndices.includes(i)) {
        await handleAddSingleTaskToSchedule(generatedTasks[i], i);
      }
    }
    setGeneratorSuccessMessage('Semua rekomendasi tugas berhasil dimasukkan ke jadwal SOP lahan Anda!');
  };

  // Render markdown-like text formatting cleanly
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-stone-800 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Heading 3 or 2
          if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
            const hText = trimmed.replace(/^#+\s*/, '');
            return (
              <h4 key={idx} className="font-extrabold text-stone-900 text-sm sm:text-base mt-3 mb-1 text-emerald-950 flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-emerald-600 rounded-full inline-block"></span>
                <span>{hText}</span>
              </h4>
            );
          }

          // Bullet list
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const bText = trimmed.replace(/^[\*\-•]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 my-1">
                <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(bText) }} />
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^(\d+)\.\s/)?.[1] || '1';
            const nText = trimmed.replace(/^\d+\.\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 my-1">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 shrink-0">
                  {num}
                </span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(nText) }} />
              </div>
            );
          }

          // Empty line
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          // Normal paragraph
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
          );
        })}
      </div>
    );
  };

  // Helper for bold and code tags
  const formatInlineMarkdown = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-stone-200/70 text-emerald-950 px-1.5 py-0.5 rounded text-[11px] font-mono">$1</code>');
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Banner Header */}
      <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                <span>Asisten AI Agronomi Indonesia • Gemini Flash Aktif</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-emerald-100 text-[11px] font-medium border border-white/15">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                <span>API Gemini Terhubung di Server</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Asisten Jadwal & Perawatan Tanaman 🤖
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Konsultasikan panduan Hari Setelah Tanam (HST), langkah perawatan yang baik, dosis pupuk presisi per pohon / per luas, serta penanganan hama secara instan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activePlot && (
              <button
                type="button"
                onClick={handleOpenGenerator}
                className="px-4 py-2.5 rounded-2xl bg-white text-emerald-900 font-extrabold text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Buatkan Jadwal SOP Otomatis</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearChat}
              title="Reset Percakapan"
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Selector: Pilih Lahan Budidaya Aktif */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Konteks Lahan Konsultasi
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              AI Membaca Data Lahan
            </span>
          </div>

          <div className="relative flex-1 sm:max-w-md">
            <select
              aria-label="Pilih Lahan untuk Konsultasi AI"
              value={activePlotId}
              onChange={(e) => {
                setActivePlotId(e.target.value);
                onSelectPlot(e.target.value);
              }}
              className="w-full text-xs sm:text-sm font-bold bg-stone-50 hover:bg-stone-100 text-stone-900 rounded-xl px-3.5 py-2 border border-stone-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer transition appearance-none truncate pr-8"
            >
              <option value="all">🌾 Konsultasi Umum / Semua Lahan</option>
              {plantings.map((p) => {
                const hst = calculateHST(p.planting_date);
                const scale = formatPlantingScale(p);
                return (
                  <option key={p.id} value={p.id}>
                    {scale.icon} {p.plot_name} — {p.crop_name} ({hst} HST, {scale.primary})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Active Plot Summary Info Card */}
        {activePlot && (
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-xl shadow-2xs shrink-0">
                {activePlotScale?.icon || '🌱'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-stone-900">{activePlot.plot_name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/80 text-emerald-900">
                    {activePlot.crop_name} ({activePlot.variety})
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white border border-emerald-300 text-emerald-900">
                    {activePlotScale?.primary}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>Umur: <strong>{activePlotHst} HST</strong></span>
                  <span>•</span>
                  <span>Tanam: {activePlot.planting_date}</span>
                  <span>•</span>
                  <span>Target Panen: {activePlot.estimated_harvest_date}</span>
                  {pendingTasks.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-800 font-semibold">{pendingTasks.length} tugas terdekat</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-xs shadow-2xs">
                Fase {activePlotHst < 15 ? 'Awal Tumbuh' : activePlotHst < 40 ? 'Vegetatif Aktif' : activePlotHst < 70 ? 'Generatif / Pembungaan' : 'Pematangan Buah'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompt Recommendation Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
          Pertanyaan Cepat Rekomendasi
        </span>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            {
              icon: '🗓️',
              label: activePlot 
                ? `Jadwal & langkah perawatan ${activePlot.crop_name.split(' ')[0]} di ${activePlotHst} HST?` 
                : 'Jadwal tahapan perawatan tanaman dari awal tanam sampai panen?'
            },
            {
              icon: '🧪',
              label: activePlot?.scale_unit === 'pohon'
                ? `Berapa takaran pupuk kocor NPK untuk ${activePlot.scale_quantity} pohon di umur ini?`
                : 'Berapa takaran pemupukan susulan berimbang yang baik?'
            },
            {
              icon: '🐛',
              label: activePlot
                ? `Hama & penyakit apa yang rawan menyerang ${activePlot.crop_name.split(' ')[0]} di ${activePlotHst} HST?`
                : 'Bagaimana cara mengatasi hama kutu kebul dan ulat penggerek?'
            },
            {
              icon: '✂️',
              label: 'Kapan waktu yang tepat untuk pemangkasan (wiwil) tunas air?'
            },
            {
              icon: '💧',
              label: 'Bagaimana aturan penyiraman dan pengeringan sebelum panen?'
            },
            {
              icon: '🩺',
              label: 'Daun tanaman menguning dan keriting, apa penyebab dan obatnya?'
            }
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip.label)}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-950 font-bold text-xs whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 shrink-0"
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm flex flex-col h-[560px] overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-emerald-700" />}
                </div>

                {/* Bubble */}
                <div className="space-y-1 min-w-0">
                  <div className={`p-4 rounded-2xl ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-stone-50 border border-stone-200/90 text-stone-800 rounded-tl-xs shadow-2xs'
                  }`}>
                    {isUser ? (
                      <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>

                  {/* Message Action / Timestamp */}
                  <div className={`flex items-center gap-2 px-1 text-[10px] text-stone-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="text-stone-400 hover:text-emerald-700 font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Salin jawaban AI"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-3xl mr-auto animate-in fade-in duration-200">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 rounded-tl-xs flex items-center gap-2 text-stone-500 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1 font-semibold text-stone-600">Asisten AI sedang menyusun rekomendasi langkah perawatan...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-stone-50/90 flex flex-col gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={activePlot 
                ? `Tanyakan perawatan untuk "${activePlot.plot_name}" (${activePlotHst} HST)...`
                : "Tanyakan jadwal HST, takaran pupuk, hama, atau perawatan tanaman..."}
              disabled={isLoading}
              className="flex-1 bg-white text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm rounded-xl px-4 py-3 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-extrabold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Kirim</span>
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
            <span>
              💡 Asisten AI otomatis menggunakan data komoditas, varietas, umur HST, dan skala pohon/lahan Anda.
            </span>
            {onNavigateToSchedule && (
              <button
                type="button"
                onClick={onNavigateToSchedule}
                className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Buka Jadwal Lahan</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* AI Schedule Generator Modal */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-linear-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl border border-white/20">
                  ✨
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">
                    Generator Jadwal SOP Perawatan AI
                  </h2>
                  <p className="text-xs text-emerald-200">
                    AI menyusun checklist tahapan perawatan titik kritis berbasis Hari Setelah Tanam (HST)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGeneratorOpen(false)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              
              {activePlot ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-extrabold text-sm text-stone-900 block">{activePlot.plot_name}</span>
                    <span className="text-stone-600 font-medium">
                      {activePlot.crop_name} ({activePlot.variety}) • {activePlotScale?.primary} • Umur {activePlotHst} HST
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunTaskGenerator}
                    disabled={isGeneratingTasks}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGeneratingTasks ? 'Menyusun...' : 'Generate Jadwal SOP'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  Pilih salah satu lahan aktif terlebih dahulu untuk membuat jadwal khusus.
                </div>
              )}

              {generatorSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{generatorSuccessMessage}</span>
                </div>
              )}

              {isGeneratingTasks && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-bold text-stone-600">
                    Sedang merancang tahapan SOP agronomis berstandar nasional dengan Gemini 3.8 Flash...
                  </p>
                </div>
              )}

              {generatedTasks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-stone-600">
                      Rekomendasi Agenda Perawatan AI ({generatedTasks.length} Titik Kritis):
                    </h3>

                    <button
                      type="button"
                      onClick={handleAddAllTasksToSchedule}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      + Tambah Semua ke Jadwal Lahan
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {generatedTasks.map((t, idx) => {
                      const isAdded = addedTaskIndices.includes(idx);
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border transition ${
                            isAdded
                              ? 'bg-emerald-50/60 border-emerald-300'
                              : 'bg-stone-50 border-stone-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-stone-900 text-white font-black text-[10px]">
                                  {t.hst} HST
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                                  {t.category.replace('_', ' ')}
                                </span>
                                <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
                                  {t.title}
                                </h4>
                              </div>

                              {t.dosage && (
                                <p className="text-[11px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-1 rounded-md inline-block">
                                  🌿 Takaran: {t.dosage}
                                </p>
                              )}

                              {t.description && (
                                <p className="text-xs text-stone-600 leading-relaxed mt-1">
                                  {t.description}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddSingleTaskToSchedule(t, idx)}
                              disabled={isAdded}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${
                                isAdded
                                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                              }`}
                            >
                              {isAdded ? '✓ Ditambahkan' : '+ Masukkan'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-stone-500">
                Tugas yang dimasukkan akan langsung muncul di menu "Jadwal & Checklist HST".
              </span>

              <button
                type="button"
                onClick={() => setIsGeneratorOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition cursor-pointer"
              >
                Selesai
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
