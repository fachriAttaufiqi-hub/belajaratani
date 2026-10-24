import { getStoredGeminiKey, hasStoredGeminiKey, isStaticOrGitHubPages } from './geminiKey';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface PlotContextPayload {
  plot_name?: string;
  crop_name?: string;
  variety?: string;
  hst?: number;
  scale_quantity?: number;
  scale_unit?: string;
  area_sqm?: number;
  planting_date?: string;
  estimated_harvest_date?: string;
  pending_tasks?: string[];
}

export interface GeneratedAITask {
  title: string;
  category: 'pemupukan' | 'penyiangan' | 'penyiraman' | 'pengendalian_hama' | 'perawatan' | 'panen';
  hst: number;
  dosage?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Mesin Agronomi Cerdas di Sisi Klien (Client-Side Agronomy Intelligence)
 * Berjalan 100% mandiri di browser tanpa server, cocok untuk GitHub Pages & Mode Offline.
 */
export function generateClientAgronomyReply(message: string, plotContext?: PlotContextPayload): string {
  const lowerMsg = (message || '').toLowerCase();
  const crop = (plotContext?.crop_name || 'tanaman budidaya').trim();
  const hst = plotContext?.hst !== undefined ? plotContext.hst : 18;
  const scale = plotContext?.scale_quantity 
    ? `${plotContext.scale_quantity} ${plotContext.scale_unit || 'pohon'}` 
    : 'skala kebun';

  // 1. Kasus Tanaman Gosong / Overdosis Pupuk (Fertilizer Burn)
  if (
    lowerMsg.includes('gosong') || 
    lowerMsg.includes('terbakar') || 
    lowerMsg.includes('over') || 
    lowerMsg.includes('hangus') || 
    (lowerMsg.includes('pupuk') && (lowerMsg.includes('kuning') || lowerMsg.includes('kering') || lowerMsg.includes('mati')))
  ) {
    return `Salam Tani! 🌱 Tenang Rekan Petani, daun menguning, ujung mengering, atau tanaman tampak gosong setelah dipupuk kocor/tabur umumnya disebabkan oleh **keracunan hara / efek plasmolisis (fertilizer burn)** akibat konsentrasi larutan pupuk terlalu pekat atau ditabur terlalu dekat ke pangkal batang.

Berikut **Langkah Penyelamatan Darurat (Recovery Protocol)**:

### 1. Pembilasan Cepat (Flushing Air)
* **Siram Segera dengan Air Bersih Berlimpah:** Lakukan penyiraman air tawar bersih pada area perakaran secara merata di pagi dan sore hari selama 2–3 hari berturut-turut.
* **Tujuan:** Melarutkan dan mencuci kelebihan garam-garam anorganik (nitrogen & kalium pekat) dari zona perakaran agar tidak terus menyedot cairan sel akar.

### 2. Hentikan Total Pupuk Kimia Sementara
* **Puasa Pupuk Kimia:** Stop 100% pemberian pupuk NPK, Urea, ZA, atau pupuk daun kimia keras selama **10 hingga 14 hari ke depan** sampai muncul pucuk/daun baru yang segar.

### 3. Pemulihan Kerusakan Akar (Anti-Stres)
* Berikan kocor **Asam Humat (Humic Acid)** dengan dosis 2 gram per liter air (atau 20–30 gram per tangki 16L). Asam humat mengikat kelebihan garam pupuk, menstabilkan pH tanah, dan memacu pertumbuhan bulu akar baru.
* Alternatif lain: Semprotkan **Asam Amino (Amino Acid)** atau ekstrak rumput laut tipis-tipis di kabut pagi hari sebagai stimulan pemulihan sel klorofil daun.

### 4. Pangkas Daun yang Rusak Parah
* Bila ada daun bawah yang sudah 80% kering atau busuk kecokelatan, pangkas dengan gunting bersih untuk mencegah infeksi jamur sekunder (*Alternaria*).

InsyaAllah dalam 7–10 hari pucuk baru akan mulai trubus kembali. Ada kendala lain di kebun Anda?`;
  }

  // 2. Kasus Takaran Pupuk Kocor & Dosis Pemupukan
  if (lowerMsg.includes('takaran') || lowerMsg.includes('dosis') || lowerMsg.includes('kocor') || lowerMsg.includes('pupuk')) {
    return `Salam Tani! 🌱 Berikut panduan **Rekomendasi Takaran & Jadwal Pemupukan Berimbang** untuk **${crop}** (${scale}) pada umur **${hst} HST**:

### 1. Takaran Kocor Presisi (Per Pohon / Batang / Polybag)
* **Dosis Standar:** Larutkan **10 – 15 gram** pupuk NPK (16-16-16 Mutiara/YaraMila) ke dalam **200 – 250 ml air** (setara 1 gelas aqua) per pohon.
* **Frekuensi:** Aplikasi kocor tiap **7 – 10 hari sekali** di pagi hari (pukul 06.30 - 09.00) atau sore hari saat tanah sedikit lembap.
* **Teknik Aplikasi:** Siramkan melingkar di bawah tajuk daun (lingkaran perakaran), **hindari mengenai pangkal batang utama atau pucuk daun**.

### 2. Takaran untuk Skala Luasan (Hamparan Lahan)
* **NPK 16-16-16 Susulan:** 50 – 75 kg per hektar (atau sekitar 5–7 gram per meter persegi).
* Buat larikan/parit dangkal 10–15 cm dari pangkal tanaman, taburkan pupuk, lalu tutup tipis dengan tanah agar nitrogen tidak menguap.

### 3. Nutrisi Tambahan Sesuai Fase:
* **Vegetatif (${hst} HST):** Tambahkan sedikit Urea atau ZA untuk mempercepat anakan/daun.
* **Generatif (>40 HST):** Ganti dengan pupuk tinggi Fosfat & Kalium (seperti MKP dan KNO3 Putih) serta Kalsium Boron untuk mencegah rontok bunga.`;
  }

  // 3. Kasus Hama & Penyakit (PHT)
  if (lowerMsg.includes('hama') || lowerMsg.includes('ulat') || lowerMsg.includes('kutu') || lowerMsg.includes('keriting') || lowerMsg.includes('jamur') || lowerMsg.includes('layu') || lowerMsg.includes('patek')) {
    return `Salam Tani! 🌱 Berikut panduan **Pengendalian Hama & Penyakit Terpadu (PHT)** untuk **${crop}** di fase ${hst} HST:

### 1. Identifikasi & Penanganan Hama Utama:
* **Ulat Grayak / Ulat Penggerek Batang:** Cek pucuk daun tiap pagi. Jika ada lubang gerekan atau kotoran seperti serbuk gergaji, semprot insektisida berbahan aktif *Emamektin Benzoat* atau *Klorantraniliprol* pada sore hari saat ulat aktif keluar.
* **Kutu Kebul & Thrips (Penyebab Daun Keriting/Kuning):** Pasang perangkap lekat kuning (*yellow sticky trap*) 40 buah/ha. Semprot insektisida berbahan aktif *Abamektin*, *Imidakloprid*, atau sabun kalium di balik permukaan daun.
* **Lalat Buah:** Pasang perangkap petrogenol (metil eugenol) di luar perimeter lahan untuk menarik lalat jantan.

### 2. Pengendalian Penyakit Jamur & Bakteri:
* **Antraknosa / Patek / Busuk Buah:** Semprot fungisida protektif berbahan aktif *Mankozeb* atau sistemik *Azoksistrobin + Difenokonazol*.
* **Layu Fusarium / Layu Bakteri:** Cabut tanaman yang layu permanen dan taburkan kapur dolomit di lubang bekas tanaman agar tidak menular ke tanaman sehat sekitarnya.
* **Sanitasi:** Bersihkan gulma di parit dan pangkas daun-daun tua agar sirkulasi udara lancar dan kelembaban kanopi tidak terlalu tinggi.`;
  }

  // 4. Kasus Pemangkasan (Wiwil Tunas Air)
  if (lowerMsg.includes('wiwil') || lowerMsg.includes('pangkas') || lowerMsg.includes('pruning') || lowerMsg.includes('tunas air')) {
    return `Salam Tani! 🌱 Panduan **Pewiwilan (Pruning Tunas Air)** untuk **${crop}**:

* **Waktu Terbaik:** Lakukan pada umur **15 – 25 HST** saat tunas liar masih berukuran kecil (panjang 3–5 cm) agar luka cepat mengering.
* **Cara Eksekusi:** Buang tunas air yang tumbuh di ketiak daun di bawah cabang utama (cabang V). Sisakan cabang produktif di atas cabang utama.
* **Waktu Pengerjaan:** Lakukan pada pagi hari saat matahari bersinar cerah agar luka pangkas langsung kering dan terhindar dari spora jamur.
* **Manfaat:** Nutrisi pupuk tidak terbagi ke daun-daun liar tidak produktif, sehingga buah atau bulir utama tumbuh optimal dan kanopi tidak terlalu rimbun.`;
  }

  // 5. Kasus Penyiraman & Manajemen Air
  if (lowerMsg.includes('siram') || lowerMsg.includes('air') || lowerMsg.includes('drainase') || lowerMsg.includes('kering')) {
    return `Salam Tani! 🌱 Panduan **Manajemen Pengairan & Penyiraman** untuk **${crop}**:

* **Fase Kritis Air:** Tanaman sangat membutuhkan air saat fase awal tanam (0-15 HST) dan saat fase pembungaan/pengisian bulir-buah.
* **Frekuensi:** Siram 1–2 kali sehari (pagi pukul 06.00-08.00 atau sore pukul 16.00-17.30). Pastikan tanah lembap namun tidak becek tergenang.
* **Drainase Parit:** Buat bedengan dengan parit sedalam 20–30 cm agar saat hujan lebat tidak ada air menggenang yang memicu busuk akar atau layu bakteri.
* **Pra-Panen:** Kurangi penyiraman 7–10 hari sebelum panen untuk memadatkan rasa manis, meningkatkan daya simpan komoditas, dan mempercepat pematangan fisiologis.`;
  }

  // 6. Panduan Umum Berdasarkan Timeline HST Lahan
  let advice = `Salam Tani! 🌱 Berikut panduan agronomi lengkap untuk **${crop}** (${scale}) pada fase saat ini (${hst} HST):\n\n`;

  if (hst <= 12) {
    advice += `### 1. Fase Pemulihan & Perakaran Awal (0 - 12 HST)
* **Kebutuhan Air:** Siram secukupnya tiap pagi atau sore hari, pastikan media lembap namun tidak becek tergenang.
* **Perlindungan:** Pasang ajir/lanjaran bila diperlukan dan amati ada tidaknya gigitan ulat pemotong atau siput.
* **Nutrisi:** Berikan larutan asam humat atau pupuk hayati organik cair encer untuk merangsang percepatan akar baru.`;
  } else if (hst <= 35) {
    advice += `### 1. Fase Vegetatif Aktif & Pembentukan Cabang (${hst} HST)
* **Pemupukan Kocor:** Larutkan 10–15 gram pupuk NPK 16-16-16 dalam 200–250 ml air per tanaman tiap 7–10 hari sekali.
* **Untuk Skala Lahan:** Taburkan 50–75 kg NPK per hektar di parit larikan lalu tutup tipis tanah.
* **Pewiwilan:** Buang tunas air liar di bawah percabangan utama agar makanan terfokus ke batang dan bunga utama.
* **Pencegahan Hama:** Semprotkan insektisida nabati atau kontak tipis-tipis di balik daun untuk mencegah thrips dan kutu kebul.`;
  } else if (hst <= 65) {
    advice += `### 1. Fase Generatif & Pembungaan (${hst} HST)
* **Nutrisi Khusus Bunga & Buah:** Tambahkan unsur Fosfor (P) dan Kalium (K), seperti pupuk MKP atau KNO3 Putih + Kalsium Boron (1 sdm per tangki 16L).
* **Manajemen Bunga:** Hindari penyemprotan kimia keras di pagi hari saat lebah penyerbuk aktif agar penyerbukan bunga tidak terganggu.
* **Pengairan:** Jaga kelembaban tanah tetap stabil, hindari tanah kekeringan ekstrem lalu tiba-tiba tergenang.`;
  } else {
    advice += `### 1. Fase Pembesaran Buah & Menjelang Panen (${hst} HST)
* **Penguatan Bobot:** Berikan pupuk Kalium tinggi (KCl atau KNO3 Putih) dan Kalsium untuk mencegah pembusukan dan mempertebal dinding buah.
* **Sanitasi:** Pangkas daun tua bagian bawah yang mulai menguning untuk melancarkan sirkulasi udara.
* **Panen:** Petik buah saat matang fisiologis di pagi hari agar kesegaran dan bobot tetap maksimal.`;
  }

  advice += `\n\n### 2. Tips Pendukung Lahan
* Pastikan bedengan bersih dari gulma liar yang berebut nutrisi pupuk.
* Catat setiap pengeluaran pupuk dan aktivitas harian di menu **Catatan & Biaya** agar evaluasi hasil panen Anda akurat.

Ada yang ingin Anda tanyakan lebih rinci tentang takaran, hama, atau perawatan lahan Anda?`;

  return advice;
}

/**
 * Task generator mandiri di sisi klien untuk GitHub Pages & Mode Offline
 */
export function generateClientAgronomyTasks(cropName: string, scaleQty?: number, scaleUnit?: string): GeneratedAITask[] {
  const lowerCrop = (cropName || '').toLowerCase();
  const isPohon = scaleUnit === 'pohon' || scaleUnit === 'polybag' || scaleUnit === 'batang';
  const scaleText = scaleQty ? `${scaleQty} ${scaleUnit || 'pohon'}` : 'lahan';

  if (lowerCrop.includes('jagung')) {
    return [
      {
        title: 'Pemupukan Dasar & Pengolahan Tanah',
        category: 'pemupukan',
        hst: 0,
        dosage: isPohon ? '200g pupuk kandang + 5g SP-36' : '150 kg NPK + 500 kg Kompos / ha',
        description: 'Campurkan pupuk organik dan fosfat ke tanah sebelum penanaman agar hara siap diserap akar bibit jagung.',
        priority: 'high'
      },
      {
        title: 'Penyiangan Gulma & Pemupukan Susulan I',
        category: 'pemupukan',
        hst: 15,
        dosage: isPohon ? '5–7 gram Urea per tanaman' : '75–100 kg Urea per hektar',
        description: 'Tugalkan pupuk berjarak 7–10 cm dari pangkal batang jagung untuk memacu vegetatif awal.',
        priority: 'high'
      },
      {
        title: 'Pengendalian Hama Ulat Grayak (FAW)',
        category: 'pengendalian_hama',
        hst: 25,
        dosage: 'Emamektin Benzoat sesuai anjuran label',
        description: 'Semprotkan pada pucuk daun jagung saat sore hari jika ditemukan gerekan daun atau serbuk kotoran ulat.',
        priority: 'high'
      },
      {
        title: 'Pemupukan Susulan II & Pembumbunan',
        category: 'pemupukan',
        hst: 35,
        dosage: isPohon ? '10–15 gram NPK per tanaman' : '100 kg NPK + 50 kg Urea per hektar',
        description: 'Tabur pupuk lalu lakukan pembumbunan (menaikkan tanah ke pangkal batang) agar jagung kokoh dan tidak rebah.',
        priority: 'high'
      },
      {
        title: 'Perawatan Fase Berbunga & Pengisian Biji',
        category: 'perawatan',
        hst: 60,
        dosage: 'KNO3 Putih / MKP + Kalsium Boron',
        description: 'Pastikan ketersediaan air mencukupi untuk memaksimalkan pengisian biji pada tongkol jagung.',
        priority: 'high'
      },
      {
        title: 'Pemanenan Jagung Masak Fisiologis',
        category: 'panen',
        hst: 105,
        dosage: 'Alat panen / karung bersih',
        description: 'Panen saat klobot mengering kecokelatan dan biji mengilap keras (kadar air ~20%).',
        priority: 'high'
      }
    ];
  }

  // Default untuk Cabai, Sayuran, & Hortikultura
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
      title: 'Pemberian Pupuk Susulan I (Kocor Awal)',
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

/**
 * Panggilan langsung ke REST API Gemini dari Browser jika pengguna memasukkan API Key di GitHub Pages
 */
async function callGeminiDirectClient(
  apiKey: string,
  message: string,
  plotContext?: PlotContextPayload,
  history?: { role: 'user' | 'model'; text: string }[]
): Promise<string> {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'];
  let systemInstruction = `Anda adalah "Asisten Ahli Tani TaniGuide" — pakar agronomi, praktisi pertanian modern, dan konsultan budidaya tanaman pangan dan hortikultura di Indonesia. Berikan instruksi langkah demi langkah, takaran pupuk per pohon/per m2, dan rekomendasi praktis ramah petani.`;

  if (plotContext) {
    systemInstruction += `\n\nData Lahan Pengguna: Komoditas ${plotContext.crop_name || '-'} (${plotContext.variety || '-'}), Umur ${plotContext.hst || 0} HST, Skala ${plotContext.scale_quantity || 0} ${plotContext.scale_unit || 'm2'}.`;
  }

  const contents: any[] = [];
  if (Array.isArray(history)) {
    for (const h of history.slice(-6)) {
      if (h && h.text) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      }
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.7,
            topP: 0.95
          }
        })
      });

      if (!res.ok) {
        console.warn(`[Gemini Client Direct] Model ${model} returned ${res.status}`);
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      console.warn(`[Gemini Client Direct] Failed with ${model}:`, err);
    }
  }

  throw new Error('Semua model Gemini direct gagal');
}

/**
 * Panggilan kirim pesan AI yang kompatibel penuh untuk Server Dev maupun GitHub Pages (Hosting Statis)
 */
export async function sendAIChatMessage(
  message: string,
  plotContext?: PlotContextPayload,
  history?: { role: 'user' | 'model'; text: string }[]
): Promise<{ success: boolean; reply?: string; error?: string; source?: 'server' | 'gemini_client' | 'client_engine' }> {
  const clientKey = getStoredGeminiKey();

  // 1. Jika pengguna memiliki Custom Gemini API Key di GitHub Pages / Static host, coba langsung ke Gemini API
  if (clientKey) {
    try {
      const reply = await callGeminiDirectClient(clientKey, message, plotContext, history);
      return { success: true, reply, source: 'gemini_client' };
    } catch (directErr) {
      console.warn('Direct Gemini client failed, trying fallback...', directErr);
    }
  }

  // 2. Coba endpoint server /api/ai/chat (bekerja jika ada server Node.js)
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        plotContext,
        history
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.reply) {
        return {
          success: true,
          reply: data.reply,
          source: 'server'
        };
      }
    }
  } catch (err: any) {
    // Pada GitHub Pages / hosting statis, fetch('/api/ai/chat') pasti gagal/404
    console.info('Server AI endpoint not reachable (GitHub Pages / Static host detected), running client-side agronomy engine.');
  }

  // 3. Fallback Mandiri Tanpa Server (Client-Side Agronomy Intelligence)
  // Menjamin 100% selalu berhasil dan tidak pernah error di GitHub Pages!
  const fallbackReply = generateClientAgronomyReply(message, plotContext);
  return {
    success: true,
    reply: fallbackReply,
    source: 'client_engine'
  };
}

/**
 * Generate AI Tasks yang kompatibel penuh dengan Server maupun GitHub Pages
 */
export async function generateAITasks(
  cropName: string,
  variety?: string,
  scaleQty?: number,
  scaleUnit?: string,
  plantingDate?: string
): Promise<{ success: boolean; tasks?: GeneratedAITask[]; error?: string; source?: 'server' | 'client_engine' }> {
  // Coba server terlebih dahulu jika bukan static host
  try {
    const res = await fetch('/api/ai/generate-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cropName,
        variety,
        scaleQty,
        scaleUnit,
        plantingDate
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
        return {
          success: true,
          tasks: data.tasks,
          source: 'server'
        };
      }
    }
  } catch (err: any) {
    console.info('Server generate-tasks not reachable, using client agronomy task generator.');
  }

  // Fallback client-side generator untuk GitHub Pages
  const clientTasks = generateClientAgronomyTasks(cropName, scaleQty, scaleUnit);
  return {
    success: true,
    tasks: clientTasks,
    source: 'client_engine'
  };
}
