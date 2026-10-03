import { CropTemplate } from '../types';

export const DEFAULT_CROPS: CropTemplate[] = [
  {
    id: 'padi',
    name: 'Padi Sawah (Oryza sativa)',
    latinName: 'Oryza sativa',
    category: 'pangan',
    varietyExamples: ['Inpari 32', 'Ciherang', 'Mekongga', 'Inpari 42 GSR', 'IR 64'],
    harvestDaysMin: 105,
    harvestDaysMax: 115,
    icon: '🌾',
    description: 'Komoditas pangan utama Indonesia dengan manajemen air teratur (macak-macak & berselang/intermittent) dan pemupukan berimbang NPK.',
    fertilizerGuide: {
      organicPerHa: '2.000 - 3.000 kg Kompos/Pupuk Kandang matang saat olah tanah',
      chemicalPerHa: 'Urea 200-250 kg/ha, NPK Phonska 250-300 kg/ha, SP-36 50 kg/ha',
      notes: 'Pemberian pupuk N dibagi 3 tahap: dasar/awal, anakan aktif, dan fase bunting (primordia).'
    },
    standardStages: [
      {
        hst: 0,
        title: 'Pindah Tanam (Transplanting) & Pengairan Macak-macak',
        category: 'perawatan',
        description: 'Tanam bibit umur 15-21 hari dengan jarak tanam jajar legowo (2:1). Genangi air tipis macak-macak (1-2 cm) agar bibit tidak hanyut dan tidak stres.',
        priority: 'high'
      },
      {
        hst: 3,
        title: 'Cek Ketinggian Air Lahan & Bibit Sulam',
        category: 'penyiraman',
        description: 'Pertahankan air macak-macak (1-2 cm). Jangan biarkan sawah mengering atau tergenang terlalu dalam (maksimal 3 cm). Lakukan penyulaman bibit yang mati.',
        priority: 'medium'
      },
      {
        hst: 7,
        title: 'Pemupukan Susulan I (Awal Vegetatif)',
        category: 'pemupukan',
        description: 'Pupuk ditabur merata saat tanah basah macak-macak agar hara segera larut dan diserap akar tanaman.',
        dosageRecommendation: 'Urea 75 kg/ha + NPK Phonska 100 kg/ha + SP-36 50 kg/ha',
        priority: 'high'
      },
      {
        hst: 10,
        title: 'Pengeringan Berselang I (Intermittent Aerasi Tanah)',
        category: 'penyiraman',
        description: 'Buang genangan air sawah selama 3-4 hari hingga tanah sedikit retak rambut untuk memacu akar bernapas dan menembus lapisan tanah lebih dalam.',
        priority: 'medium'
      },
      {
        hst: 14,
        title: 'Penggenangan Kembali (2-3 cm) & Penyiangan I (Matun)',
        category: 'penyiraman',
        description: 'Alirkan air setinggi 2-3 cm ke petakan sawah. Lakukan penyiangan gulma menggunakan alat gasrok/landak sekaligus menggemburkan lumpur.',
        priority: 'high'
      },
      {
        hst: 20,
        title: 'Pemupukan Susulan II (Pembentukan Anakan Produktif)',
        category: 'pemupukan',
        description: 'Kondisi air macak-macak. Mendorong anakan produktif maksimum. Tutup saluran pembuangan air selama 3 hari setelah pemupukan.',
        dosageRecommendation: 'Urea 75 kg/ha + NPK Phonska 100 kg/ha',
        priority: 'high'
      },
      {
        hst: 25,
        title: 'Pengaturan Debit Air Anakan Aktif',
        category: 'penyiraman',
        description: 'Jaga air setinggi 2-3 cm. Hindari genangan terlalu tinggi (>5 cm) karena genangan dalam dapat menghambat pertumbuhan tunas anakan baru.',
        priority: 'medium'
      },
      {
        hst: 28,
        title: 'Monitoring Penggerek Batang (Sundep/Beluk)',
        category: 'pengendalian_hama',
        description: 'Periksa tunas layu/mati. Pasang perangkap lampu atau aplikasikan insektisida sistemik berbahan aktif karbofuran/dimehipo jika populasi tinggi.',
        priority: 'medium'
      },
      {
        hst: 32,
        title: 'Pengeringan Berselang II (Stop Anakan Tidak Produktif)',
        category: 'penyiraman',
        description: 'Keringkan sawah selama 4-5 hari untuk menghentikan terbentuknya anakan liar yang tidak produktif dan memperkuat batang dari rebah.',
        priority: 'medium'
      },
      {
        hst: 38,
        title: 'Penggenangan Air 3 cm & Penyiangan II',
        category: 'penyiraman',
        description: 'Masukkan air kembali setinggi 3 cm. Cabut sisa rumput liar di sekitar rumpun padi sebelum tajuk tanaman saling menutup.',
        priority: 'medium'
      },
      {
        hst: 42,
        title: 'Pemupukan Susulan III (Fase Bunting / Primordia)',
        category: 'pemupukan',
        description: 'Fase kritis calon malai bulir padi. Tambahkan Kalium untuk kekuatan dinding sel batang dan bobot gabah.',
        dosageRecommendation: 'Urea 50 kg/ha + KCl 50 kg/ha (atau NPK 75 kg/ha)',
        priority: 'high'
      },
      {
        hst: 45,
        title: 'Penggenangan Intensif Kritis (3-5 cm Fase Bunting)',
        category: 'penyiraman',
        description: 'FASE SANGAT KRITIS AIR! Tanaman padi bunting membutuhkan air melimpah. Jangan biarkan lahan kekeringan pada fase ini agar malai tidak hampa.',
        priority: 'high'
      },
      {
        hst: 55,
        title: 'Penyiraman & Proteksi Berbunga (Blas & Hama)',
        category: 'pengendalian_hama',
        description: 'Pertahankan air 3-5 cm. Semprot fungisida pencegah jamur Pyricularia oryzae (Blas) dan waspadai walang sangit saat bunga mulai mekar pagi hari.',
        priority: 'high'
      },
      {
        hst: 65,
        title: 'Pengairan Teratur Fase Pengisian Bulir (Milky Stage)',
        category: 'penyiraman',
        description: 'Terapkan pengairan basah-kering bergantian (irigasi 3 cm lalu biarkan surut perlahan hingga tanah lembab, lalu aliri lagi). Memaksimalkan pengisian pati gabah.',
        priority: 'high'
      },
      {
        hst: 78,
        title: 'Pengairan Pengerasan Bulir & Cek Hama Tikus/Burung',
        category: 'penyiraman',
        description: 'Alirkan air segar setinggi 2-3 cm. Pasang plastik kemrepyek/jaring pelindung burung pipit dan umpan tikus di pematang sawah.',
        priority: 'medium'
      },
      {
        hst: 88,
        title: 'Pengairan Terakhir (Bulir Mulai Menguning 70%)',
        category: 'penyiraman',
        description: 'Pemberian air terakhir sebelum persiapan pengeringan total. Pastikan tanaman tidak mengalami kekeringan ekstrem sebelum daun bendera mengering.',
        priority: 'medium'
      },
      {
        hst: 98,
        title: 'Pengeringan Total Petakan Sawah (Pra-Panen)',
        category: 'penyiraman',
        description: 'Buka seluruh pintu saluran pembuangan air 10-14 hari sebelum panen. Pengeringan total ini memadatkan tanah untuk mempermudah pemanenan dan mempercepat kematangan bulir seragam.',
        priority: 'high'
      },
      {
        hst: 110,
        title: 'Panen Raya Padi',
        category: 'panen',
        description: 'Potong padi saat 90-95% malai telah menguning dan kadar air gabah berkisar 20-25%. Segera lakukan perontokan dengan thresher/combine harvester.',
        priority: 'high'
      }
    ]
  },
  {
    id: 'jagung',
    name: 'Jagung Hibrida / Manis (Zea mays)',
    latinName: 'Zea mays',
    category: 'palawija',
    varietyExamples: ['Bisi 18', 'Pioneer P35', 'NK 212', 'Bonanza F1 (Manis)', 'Talenta (Manis)'],
    harvestDaysMin: 70,
    harvestDaysMax: 105,
    icon: '🌽',
    description: 'Tanaman palawija berakar serabut dengan kebutuhan hara Nitrogen dan Fosfat tinggi serta tidak tahan genangan air.',
    fertilizerGuide: {
      organicPerHa: '2.000 kg Kompos/Kotoran Ayam terfermentasi',
      chemicalPerHa: 'Urea 300-350 kg/ha, NPK 15-15-15 200-250 kg/ha, SP-36 75 kg/ha',
      notes: 'Pemupukan dilakukan dengan cara ditugal di samping lubang tanam (jarak 7-10 cm) lalu ditutup tanah.'
    },
    standardStages: [
      {
        hst: 0,
        title: 'Tanam Benih & Penyiraman Jenuh Awal',
        category: 'perawatan',
        description: 'Tanam 1 biji per lubang (jarak 70 x 20 cm) sedalam 3-5 cm. Siram tanah hingga basah merata (kapasitas lapang) agar benih cepat menyerap air dan berkecambah.',
        priority: 'high'
      },
      {
        hst: 4,
        title: 'Cek Kelembaban Tanah Saat Benih Berkecambah',
        category: 'penyiraman',
        description: 'Periksa kelembaban tanah. Jika cuaca terik dan tanah mengering, siram ringan sela barisan agar kecambah jagung tidak layu.',
        priority: 'medium'
      },
      {
        hst: 7,
        title: 'Penyulaman & Penyiraman Bibit Muda',
        category: 'perawatan',
        description: 'Sulam benih yang tidak tumbuh dengan benih cadangan agar populasi seragam. Siram tanaman setelah penyulaman.',
        priority: 'medium'
      },
      {
        hst: 10,
        title: 'Pemupukan Susulan I & Pengairan Langsung',
        category: 'pemupukan',
        description: 'Tugal pupuk 5 cm di samping batang (jarak 7 cm). Segera siram atau alirkan air sela baris agar pupuk cepat larut dan diserap akar.',
        dosageRecommendation: 'Urea 100 kg/ha + NPK 15-15-15 100 kg/ha + SP-36 50 kg/ha',
        priority: 'high'
      },
      {
        hst: 15,
        title: 'Penyiraman Rutin & Penyiangan Gulma I',
        category: 'penyiraman',
        description: 'Alirkan air pada parit antar bedengan (leb parit) selama 2-3 jam lalu buang kelebihannya. Bersihkan gulma yang mulai menyaingi tanaman.',
        priority: 'medium'
      },
      {
        hst: 20,
        title: 'Pembumbunan I & Penggemburan Tanah',
        category: 'penyiangan',
        description: 'Kumpulkan tanah gembur ke pangkal batang (bumbun) untuk menopang tanaman agar kokoh dari tiupan angin.',
        priority: 'medium'
      },
      {
        hst: 25,
        title: 'Waspada Ulat Grayak Jagung (FAW) & Cek Air',
        category: 'pengendalian_hama',
        description: 'Periksa titik tumbuh pupus daun jagung. Semprot insektisida emamektin benzoat di sore hari jika ditemukan serbuk gergaji/ulat.',
        priority: 'high'
      },
      {
        hst: 30,
        title: 'Pemupukan Susulan II & Pengairan Parit (Leb)',
        category: 'pemupukan',
        description: 'Tugal pupuk pada jarak 12 cm dari pangkal batang. Lakukan pengairan leb pada parit antar bedengan setelah pemupukan.',
        dosageRecommendation: 'Urea 150 kg/ha + NPK Phonska 150 kg/ha',
        priority: 'high'
      },
      {
        hst: 38,
        title: 'Penyiraman Fase Vegetatif Cepat (V8-V10)',
        category: 'penyiraman',
        description: 'Tanaman bertambah tinggi pesat. Kebutuhan air meningkat hingga 5-6 mm per hari. Siram sela barisan jika tidak ada hujan lebih dari 4 hari.',
        priority: 'medium'
      },
      {
        hst: 45,
        title: 'Pembumbunan Akhir & Penyiangan II',
        category: 'penyiangan',
        description: 'Bumbun tanah lebih tinggi untuk menopang akar tunjang/akar hawa yang mulai keluar dari buku batang bawah.',
        priority: 'medium'
      },
      {
        hst: 50,
        title: 'Pengairan Intensif Fase Kritis (Keluar Bunga Jantan & Tongkol)',
        category: 'penyiraman',
        description: 'FASE PALING KRITIS AIR! Muncul bunga jantan (tassel) dan rambut tongkol (silk). Kekeringan 2 hari pada fase ini dapat menurunkan hasil 50%. Pastikan tanah lembab!',
        priority: 'high'
      },
      {
        hst: 58,
        title: 'Penyiraman Fase Penyerbukan & Pembentukan Biji',
        category: 'penyiraman',
        description: 'Lakukan pengairan parit. Hindari menyiram dengan semprotan deras langsung dari atas tajuk saat bunga jantan melepaskan serbuk sari (08.00-11.00).',
        priority: 'high'
      },
      {
        hst: 68,
        title: 'Penyiraman Fase Pengisian Biji (Dough Stage)',
        category: 'penyiraman',
        description: 'Pertahankan kelembaban tanah untuk pengisian pati biji jagung. Bagi petani JAGUNG MANIS, ini adalah persiapan panen.',
        priority: 'medium'
      },
      {
        hst: 72,
        title: 'Panen Jagung Manis (Khusus Bonanza / Talenta)',
        category: 'panen',
        description: 'Untuk JAGUNG MANIS: Panen sekarang saat biji matang susu, rambut tongkol kering cokelat kehitaman, dan rasa manis maksimal.',
        priority: 'high'
      },
      {
        hst: 82,
        title: 'Pengairan Terakhir Jagung Pipil Kering',
        category: 'penyiraman',
        description: 'Pemberian air terakhir untuk jagung pipil. Setelah fase ini, air dihentikan agar kelobot dan tongkol mengering alami di batang.',
        priority: 'medium'
      },
      {
        hst: 90,
        title: 'Penghentian Total Pengairan & Pengelupasan Kelobot',
        category: 'penyiraman',
        description: 'Hentikan pengairan. Dapat dilakukan pematahan ujung tongkol ke bawah (ditekuk) agar tidak kemasukan air hujan saat pengeringan.',
        priority: 'medium'
      },
      {
        hst: 100,
        title: 'Panen Raya Jagung Pipil Kering',
        category: 'panen',
        description: 'Kelobot jagung telah kering kecokelatan, biji mengkilap keras dan terbentuk lapisan hitam (black layer) pada pangkal biji. Kadar air 18-22%.',
        priority: 'high'
      }
    ]
  },
  {
    id: 'cabai',
    name: 'Cabai Rawit / Merah (Capsicum annuum)',
    latinName: 'Capsicum annuum / frutescens',
    category: 'hortikultura',
    varietyExamples: ['Ori 212', 'Pilar F1', 'Gada MK', 'Kaliber', 'Maruti'],
    harvestDaysMin: 75,
    harvestDaysMax: 120,
    icon: '🌶️',
    description: 'Tanaman hortikultura bernilai ekonomis tinggi yang sensitif kelebihan air tapi butuh kelembaban stabil, lanjaran ajir, dan kocor rutin.',
    fertilizerGuide: {
      organicPerHa: '5.000 - 10.000 kg Kohe Kambing/Sapi fermentasi + Dolomit 1.500 kg',
      chemicalPerHa: 'NPK 16-16-16 400 kg/ha, KNO3 Merah & Putih 150 kg/ha, Kalsium 100 kg/ha',
      notes: 'Metode pengocoran pupuk cair dianjurkan setiap 7-10 hari sekali.'
    },
    standardStages: [
      {
        hst: 0,
        title: 'Pindah Tanam Sore Hari & Penyiraman Awal',
        category: 'perawatan',
        description: 'Tanam bibit umur 25-30 hari pada bedengan mulsa. Siram lubang tanam secukupnya dengan air bersih pada sore hari agar bibit tidak layu stres.',
        priority: 'high'
      },
      {
        hst: 2,
        title: 'Penyiraman Ringan Pagi/Sore (Adaptasi Bibit)',
        category: 'penyiraman',
        description: 'Siram ringan 100-150 ml per lubang tanam di pagi atau sore hari selama 3 hari pertama sampai akar baru mencengkeram tanah.',
        priority: 'high'
      },
      {
        hst: 5,
        title: 'Cek Kelembaban Mulsa & Penyulaman',
        category: 'penyiraman',
        description: 'Periksa kelembaban tanah di bawah plastik mulsa. Siram jika terasa kering dan lakukan penyulaman pada bibit yang patah/mati.',
        priority: 'medium'
      },
      {
        hst: 7,
        title: 'Pengocoran Pupuk I (Akar & Tunas Baru)',
        category: 'pemupukan',
        description: 'Kocorkan larutan NPK 16-16-16 + Asam Humat 200 ml per lubang tanam di sekeliling perakaran.',
        dosageRecommendation: 'NPK 16-16-16 (3-5 gram per liter air)',
        priority: 'high'
      },
      {
        hst: 11,
        title: 'Penyiraman Rutin Lubang Tanam',
        category: 'penyiraman',
        description: 'Siram air bersih 200 ml per lubang tanam untuk menjaga ketersediaan air tanaman yang mulai tumbuh tunas hijau baru.',
        priority: 'medium'
      },
      {
        hst: 14,
        title: 'Pemasangan Ajir Bambu (Lanjaran)',
        category: 'perawatan',
        description: 'Tancapkan bambu ajir setinggi 1,5 meter di samping tanaman sedini mungkin agar tidak melukai perakaran yang mulai menyebar.',
        priority: 'medium'
      },
      {
        hst: 18,
        title: 'Perempelan Tunas Air & Penyiraman Bedengan',
        category: 'perawatan',
        description: 'Buang semua tunas liar di ketiak daun bawah cabang utama (huruf Y). Siram tanaman setelah perempelan tunas.',
        priority: 'medium'
      },
      {
        hst: 21,
        title: 'Pengocoran Pupuk Susulan II & Ikat Batang ke Ajir',
        category: 'pemupukan',
        description: 'Ikat longgar batang utama ke bambu ajir dengan tali rafia membentuk angka 8. Kocorkan larutan NPK + KNO3 Merah.',
        dosageRecommendation: 'NPK 5 gram/L + KNO3 Merah 2 gram/L (250 ml/pohon)',
        priority: 'high'
      },
      {
        hst: 26,
        title: 'Pengendalian Hama Thrips, Kutu Kebul & Tungau',
        category: 'pengendalian_hama',
        description: 'Semprot insektisida abamektin/imidakloprid untuk mencegah daun keriting dan virus kuning (gemini virus). Semprot bagian bawah daun.',
        priority: 'high'
      },
      {
        hst: 30,
        title: 'Pengairan Sela Parit (Leb Ringan Parit)',
        category: 'penyiraman',
        description: 'Alirkan air pada parit antar bedengan setinggi 1/3 tinggi bedengan selama 2 jam agar air meresap ke dalam bedengan dari samping, lalu kuras.',
        priority: 'medium'
      },
      {
        hst: 35,
        title: 'Fase Muncul Bunga & Semprot Kalsium-Boron',
        category: 'pemupukan',
        description: 'Semprot pupuk mikro Kalsium + Boron di pagi hari untuk mencegah kerontokan bunga dan memperkuat tangkai buah.',
        dosageRecommendation: 'Kalsium-Boron cair 2 ml/L air disemprot merata',
        priority: 'high'
      },
      {
        hst: 40,
        title: 'Penyiraman Teratur Fase Berbunga Lebat',
        category: 'penyiraman',
        description: 'FASE KRITIS AIR! Tanaman tidak boleh mengalami stres kekeringan saat bunga mekar karena dapat menyebabkan bunga gugur massal. Siram rutin.',
        priority: 'high'
      },
      {
        hst: 48,
        title: 'Pengocoran Pembuahan (KNO3 Putih + MKP)',
        category: 'pemupukan',
        description: 'Kocorkan nutrisi tinggi Kalium dan Fosfat untuk mempercepat pembesaran buah cabai dan menebalkan dinding buah.',
        dosageRecommendation: 'NPK 5 gr/L + MKP 3 gr/L + KNO3 Putih 3 gr/L (300 ml/lubang)',
        priority: 'high'
      },
      {
        hst: 55,
        title: 'Penyiraman & Pengawasan Patek (Antraknosa)',
        category: 'pengendalian_hama',
        description: 'Siram tanaman dengan menjaga daun tetap kering. Semprot fungisida azoksistrobin/mankozeb jika musim hujan untuk mencegah busuk buah antraknosa.',
        priority: 'high'
      },
      {
        hst: 65,
        title: 'Pengairan Parit Teratur Fase Pematangan Buah',
        category: 'penyiraman',
        description: 'Alirkan air secukupnya pada parit. Pastikan tanah tetap lembab agar buah cabai tidak keriput dan bobot timbangan maksimal.',
        priority: 'medium'
      },
      {
        hst: 75,
        title: 'Panen Perdana Cabai & Penyiraman Pemulihan',
        category: 'panen',
        description: 'Petik buah cabai beserta tangkainya saat 80-90% merah di pagi hari. Setelah petik, segera siram lubang tanam untuk memulihkan tanaman.',
        priority: 'high'
      },
      {
        hst: 82,
        title: 'Kocor Pupuk Pemulihan & Panen Ke-2',
        category: 'pemupukan',
        description: 'Kocor pupuk NPK encer untuk merangsang bunga gelombang kedua sembari memetik buah matang berikutnya.',
        dosageRecommendation: 'NPK 16-16-16 (5 gram per liter air)',
        priority: 'medium'
      },
      {
        hst: 90,
        title: 'Panen Berkala & Sanitasi Daun Tua',
        category: 'panen',
        description: 'Panen rutin tiap 5-7 hari sekali. Rontokkan daun bawah yang menguning dan bersihkan buah cabai yang busuk agar tidak menular.',
        priority: 'medium'
      }
    ]
  },
  {
    id: 'bawang_merah',
    name: 'Bawang Merah (Allium cepa var. aggregatum)',
    latinName: 'Allium cepa var. ascalonicum',
    category: 'hortikultura',
    varietyExamples: ['Batu Ijo', 'Tajuk', 'Bauji', 'Biru Lancor', 'Sanren F1'],
    harvestDaysMin: 55,
    harvestDaysMax: 65,
    icon: '🧅',
    description: 'Tanaman bernilai tinggi dengan siklus cepat 60 hari. Sangat membutuhkan penyiraman rutin 2x sehari di awal tanam dan bebas dari genangan air.',
    fertilizerGuide: {
      organicPerHa: '5.000 kg Kompos matang + Kapur Pertanian (Dolomit) 1.000 kg',
      chemicalPerHa: 'NPK 16-16-16 250 kg/ha, ZA 150 kg/ha, SP-36 100 kg/ha, KNO3 Putih 100 kg/ha',
      notes: 'Bawang merah sangat menyukai unsur Sulfur (S) dari pupuk ZA untuk meningkatkan aroma dan ketajaman warna merah.'
    },
    standardStages: [
      {
        hst: 0,
        title: 'Tanam Umbi Bibit & Penyiraman Jenuh',
        category: 'perawatan',
        description: 'Tanam umbi potong 1/3 ujung dengan jarak 15 x 15 cm. Siram bedengan hingga basah kuyup agar tanah menempel rapat ke umbi.',
        priority: 'high'
      },
      {
        hst: 2,
        title: 'Penyiraman Pagi & Sore Hari (Fase Kritis Awal)',
        category: 'penyiraman',
        description: 'Siram bedengan 2 kali sehari (pagi pukul 07.00 dan sore pukul 16.00). Kebutuhan air sangat mutlak agar ujung umbi bertunas serempak.',
        priority: 'high'
      },
      {
        hst: 5,
        title: 'Penyiraman Rutin 2x Sehari & Cek Tunas',
        category: 'penyiraman',
        description: 'Lanjutkan penyiraman 2x sehari. Periksa daun muda yang mulai mencuat 2-3 cm dari permukaan tanah.',
        priority: 'high'
      },
      {
        hst: 9,
        title: 'Siram Bilas Pagi Hari (Pencegahan Embun Upas)',
        category: 'penyiraman',
        description: 'PENTING! Lakukan siram bilas halus di pagi hari sebelum matahari terik untuk membasuh embun malam yang mengandung spora jamur bercak ungu/trotol.',
        priority: 'high'
      },
      {
        hst: 12,
        title: 'Pemupukan Susulan I & Pengairan Langsung',
        category: 'pemupukan',
        description: 'Taburkan pupuk di sela tanaman lalu segera siram air bersih sampai pupuk larut ke tanah.',
        dosageRecommendation: 'NPK 16-16-16 100 kg/ha + ZA 75 kg/ha',
        priority: 'high'
      },
      {
        hst: 16,
        title: 'Penyiangan Gulma I & Pengamatan Ulat Grayak',
        category: 'penyiangan',
        description: 'Cabut gulma rumput liar dengan tangan hati-hati agar tidak mencabut akar bawang yang dangkal. Amati lubang ulat pada daun transparan.',
        priority: 'high'
      },
      {
        hst: 20,
        title: 'Pengairan Parit (Leb Parit Sela Bedengan)',
        category: 'penyiraman',
        description: 'Alirkan air ke parit bedengan selama 1-2 jam agar tanah bedengan menyerap air dari bawah. Buang sisa air setelahnya, jangan ada genangan.',
        priority: 'medium'
      },
      {
        hst: 25,
        title: 'Pemupukan Susulan II (Fase Vegetatif Akhir)',
        category: 'pemupukan',
        description: 'Dukung pembentukan anakan umbi baru dengan tambahan Kalium dan ZA.',
        dosageRecommendation: 'NPK 100 kg/ha + ZA 50 kg/ha + KCl 50 kg/ha',
        priority: 'high'
      },
      {
        hst: 30,
        title: 'Penyiraman 1x Sehari Pagi Hari & Cek Moler',
        category: 'penyiraman',
        description: 'Penyiraman dikurangi menjadi 1 kali sehari di pagi hari. Periksa daun terpilin (penyakit moler/fusarium), segera cabut tanaman yang sakit.',
        priority: 'medium'
      },
      {
        hst: 35,
        title: 'Pemupukan Pembesaran Umbi (Generatif K)',
        category: 'pemupukan',
        description: 'Kocorkan pupuk tinggi Kalium agar umbi padat, berbobot, dan merah mengkilap.',
        dosageRecommendation: 'KNO3 Putih 75 kg/ha + Kalium Sulfat (ZK) 50 kg/ha',
        priority: 'high'
      },
      {
        hst: 40,
        title: 'Pengairan Parit Fase Pembesaran Umbi',
        category: 'penyiraman',
        description: 'Alirkan air parit sela bedengan secukupnya. Umbi sedang membesar dan membutuhkan kelembaban optimal.',
        priority: 'medium'
      },
      {
        hst: 48,
        title: 'Pengurangan Intensitas Penyiraman',
        category: 'penyiraman',
        description: 'Siram tipis 2 hari sekali saja. Mengurangi air untuk mencegah umbi busuk dan membantu pematangan kulit luar.',
        priority: 'medium'
      },
      {
        hst: 53,
        title: 'Penghentian Total Pengairan (Pra-Panen)',
        category: 'penyiraman',
        description: 'STOP PENYIRAMAN TOTAL 5-7 hari sebelum panen. Tanah harus kering agar kulit umbi terbentuk kuat, merah merekah, dan tahan disimpan berbulan-bulan.',
        priority: 'high'
      },
      {
        hst: 60,
        title: 'Panen Raya Bawang Merah',
        category: 'panen',
        description: 'Cabut tanaman saat 70-80% daun telah rebah dan leher batang terasa lemas. Ikat rumpun daun dan jemur di para-para di bawah sinar matahari.',
        priority: 'high'
      }
    ]
  },
  {
    id: 'tomat',
    name: 'Tomat Sayur / Buah (Solanum lycopersicum)',
    latinName: 'Solanum lycopersicum',
    category: 'hortikultura',
    varietyExamples: ['Servo F1', 'Tymoti F1', 'Gustavi F1', 'Mawar', 'Betavila F1'],
    harvestDaysMin: 65,
    harvestDaysMax: 85,
    icon: '🍅',
    description: 'Tanaman sayuran buah produktif dengan kebutuhan pemangkasan tunas air, ajir kokoh, dan penyiraman stabil pencegah busuk ujung buah.',
    fertilizerGuide: {
      organicPerHa: '5.000 kg Pupuk Kandang terfermentasi',
      chemicalPerHa: 'NPK 16-16-16 300 kg/ha, SP-36 100 kg/ha, KCl 100 kg/ha, Kalsium Nitrat 75 kg/ha',
      notes: 'Penyemprotan Kalsium-Boron sangat penting sejak masa berbunga hingga buah muda.'
    },
    standardStages: [
      {
        hst: 0,
        title: 'Pindah Tanam Bibit Tomat & Penyiraman Awal',
        category: 'perawatan',
        description: 'Tanam bibit umur 20-25 hari di lubang tanam mulsa pada sore hari. Siram 200 ml air per lubang tanam.',
        priority: 'high'
      },
      {
        hst: 3,
        title: 'Penyiraman Adaptasi Bibit Pagi Hari',
        category: 'penyiraman',
        description: 'Siram air bersih di sekeliling pangkal batang. Jaga agar media tanah tidak kering di bawah sengatan sinar matahari siang.',
        priority: 'medium'
      },
      {
        hst: 7,
        title: 'Kocor Nutrisi Awal (NPK Encer) & Cek Sulaman',
        category: 'pemupukan',
        description: 'Kocorkan larutan NPK encer 3 gram/L (200 ml per pohon) untuk merangsang perakaran baru menembus tanah.',
        dosageRecommendation: 'NPK 16-16-16 3 gr/liter air',
        priority: 'high'
      },
      {
        hst: 12,
        title: 'Penyiraman Rutin & Pemasangan Ajir Bambu',
        category: 'penyiraman',
        description: 'Tancapkan bambu ajir setinggi 1,8 meter tegak lurus. Siram bedengan secukupnya agar perakaran tidak terganggu.',
        priority: 'medium'
      },
      {
        hst: 18,
        title: 'Pruning Tunas Air & Ikat Batang Pola Angka 8',
        category: 'perawatan',
        description: 'Pangkas tunas ketiak liar, sisakan 1-2 batang utama yang paling kokoh. Ikat ke ajir dengan tali rafia longgar.',
        priority: 'medium'
      },
      {
        hst: 24,
        title: 'Pemupukan Susulan II & Kocor Air Nutrisi',
        category: 'pemupukan',
        description: 'Kocorkan NPK 5 gr/L + Kalsium Nitrat 2 gr/L ke lubang tanam (250 ml/pohon).',
        dosageRecommendation: 'NPK 16-16-16 + Kalsium Nitrat',
        priority: 'high'
      },
      {
        hst: 30,
        title: 'Pengairan Parit Sela Bedengan (Leb Parit)',
        category: 'penyiraman',
        description: 'Alirkan air pada parit bedengan selama 2 jam agar tanah meresap air optimal. Jangan biarkan air menggenangi pucuk bedengan.',
        priority: 'medium'
      },
      {
        hst: 36,
        title: 'Penyiraman Kritis Fase Berbunga & Kalsium Semprot',
        category: 'penyiraman',
        description: 'FASE KRITIS AIR! Fluktuasi air yang drastis menyebabkan Blossom End Rot (busuk ujung buah). Siram teratur dan semprot pupuk Kalsium.',
        priority: 'high'
      },
      {
        hst: 45,
        title: 'Pasang Perangkap Lalat Buah & Kocor Kalium',
        category: 'pengendalian_hama',
        description: 'Pasang botol berumpan petrogenol (metil eugenol) di sekeliling kebun. Kocorkan pupuk KNO3 Putih untuk pengisian buah.',
        priority: 'high'
      },
      {
        hst: 55,
        title: 'Penyiraman Teratur Fase Pembesaran Buah',
        category: 'penyiraman',
        description: 'Jaga kelembaban stabil. Hindari tanah kering lalu tiba-tiba disiram sangat banyak karena dapat menyebabkan kulit buah tomat pecah (cracking).',
        priority: 'high'
      },
      {
        hst: 70,
        title: 'Panen Perdana Tomat Segar',
        category: 'panen',
        description: 'Petik buah tomat saat semburat kemerahan 75-80% (derajat kematangan pasar) di pagi hari. Siram ringan setelah panen.',
        priority: 'high'
      }
    ]
  },
  {
    id: 'kedelai',
    name: 'Kedelai (Glycine max)',
    latinName: 'Glycine max',
    category: 'palawija',
    varietyExamples: ['Anjasmoro', 'Grobogan', 'Dena 1', 'Argomulyo', 'Detam 1'],
    harvestDaysMin: 75,
    harvestDaysMax: 85,
    icon: '🫘',
    description: 'Tanaman legum penambat nitrogen bebas lewat bintil akar (Rhizobium). Sangat cocok untuk rotasi tanaman sehabis panen padi.',
    fertilizerGuide: {
      organicPerHa: '1.000 - 1.500 kg Kompos',
      chemicalPerHa: 'Urea 50 kg/ha, SP-36 100 kg/ha, KCl 75 kg/ha, Inokulan Rhizobium (Legin)',
      notes: 'Kebutuhan Urea rendah karena tanaman mampu mengikat N bebas dari udara.'
    },
    standardStages: [
      {
        hst: 0,
        title: 'Tanam Benih Campur Rhizobium & Penyiraman',
        category: 'perawatan',
        description: 'Tugal benih 2-3 biji per lubang (jarak 40 x 15 cm) yang telah dicampur inokulan Rhizobium. Siram tanah hingga lembab merata.',
        priority: 'high'
      },
      {
        hst: 5,
        title: 'Cek Perkembangan Kecambah & Kelembaban Tanah',
        category: 'penyiraman',
        description: 'Siram sela baris jika tidak ada hujan. Pastikan tanah cukup basah untuk mendorong hipokotil kecambah menembus tanah.',
        priority: 'medium'
      },
      {
        hst: 12,
        title: 'Penyiangan I & Waspada Lalat Bibit (Ophiomyia)',
        category: 'penyiangan',
        description: 'Bersihkan gulma muda dan amati lubang gererek pada batang bawah dekat leher akar.',
        priority: 'medium'
      },
      {
        hst: 18,
        title: 'Pemupukan Susulan I & Pengairan Parit',
        category: 'pemupukan',
        description: 'Tugal pupuk di samping barisan tanaman lalu siram tanah.',
        dosageRecommendation: 'Urea 25 kg/ha + SP-36 75 kg/ha + KCl 50 kg/ha',
        priority: 'high'
      },
      {
        hst: 28,
        title: 'Penyiraman Menjelang Berbunga & Pembumbunan',
        category: 'penyiraman',
        description: 'Alirkan air pada parit antar bedengan. Kumpulkan tanah ke pangkal batang sebelum tanaman mulai berbunga rimbun.',
        priority: 'medium'
      },
      {
        hst: 40,
        title: 'Pengairan Kritis Fase Berbunga & Bentuk Polong',
        category: 'penyiraman',
        description: 'FASE SANGAT KRITIS AIR! Tanaman kedelai yang mengalami kekeringan pada masa berbunga akan mengalami keguguran bunga hingga 70%. Siram teratur.',
        priority: 'high'
      },
      {
        hst: 52,
        title: 'Pengendalian Penggerek Polong & Pengairan Biji',
        category: 'pengendalian_hama',
        description: 'Semprot insektisida pencegah ulat penggerek polong (Etiella). Jaga kelembaban tanah untuk pengisian biji kedelai dalam polong.',
        priority: 'high'
      },
      {
        hst: 68,
        title: 'Penghentian Pengairan Pra-Panen',
        category: 'penyiraman',
        description: 'Hentikan pengairan. Biarkan daun menguning dan rontok secara alami agar polong cepat mengering.',
        priority: 'medium'
      },
      {
        hst: 78,
        title: 'Panen Raya Kedelai',
        category: 'panen',
        description: '95% daun telah rontok menguning, polong berwarna cokelat tua dan berbunyi gemerincing saat digoyang. Segera panen dan jemur.',
        priority: 'high'
      }
    ]
  },
  {
    id: 'semangka',
    name: 'Semangka / Melon (Citrullus lanatus)',
    latinName: 'Citrullus lanatus',
    category: 'buah',
    varietyExamples: ['Inul F1', 'Amara F1', 'Maduri (Kuning)', 'Action 88', 'Golden Emerald'],
    harvestDaysMin: 60,
    harvestDaysMax: 70,
    icon: '🍉',
    description: 'Tanaman buah merambat dengan teknik pemangkasan pucuk, penyerbukan bunga betina manual, dan pengaturan air fase pemanisan.',
    fertilizerGuide: {
      organicPerHa: '5.000 kg Pupuk Kandang + Dolomit 1.500 kg',
      chemicalPerHa: 'NPK 16-16-16 350 kg/ha, SP-36 100 kg/ha, ZK/KNO3 150 kg/ha',
      notes: 'Hindari pupuk tinggi N saat fase pembentukan buah agar buah tidak pecah dan rasa tetap manis lebat.'
    },
    standardStages: [
      {
        hst: 0,
        title: 'Pindah Tanam Semangka & Penyiraman Basah',
        category: 'perawatan',
        description: 'Tanam bibit umur 10-12 hari di bedengan bermulsa perak. Siram 300 ml air per lubang tanam.',
        priority: 'high'
      },
      {
        hst: 3,
        title: 'Penyiraman Ringan Pagi/Sore',
        category: 'penyiraman',
        description: 'Siram air secukupnya setiap hari agar akar bibit muda tidak mengering di bawah plastik mulsa.',
        priority: 'medium'
      },
      {
        hst: 7,
        title: 'Kocor Nutrisi Awal (NPK Encer)',
        category: 'pemupukan',
        description: 'Kocorkan larutan NPK 3 gram/L (250 ml per lubang tanam) di sekeliling perakaran.',
        dosageRecommendation: 'NPK 16-16-16 3 gram/L',
        priority: 'high'
      },
      {
        hst: 14,
        title: 'Topping Pucuk Utama & Penyiraman Bedengan',
        category: 'perawatan',
        description: 'Pangkas pucuk utama pada ruas ke-4 atau ke-5 untuk merangsang munculnya 2-3 cabang sekunder produktif. Siram tanah setelah topping.',
        priority: 'high'
      },
      {
        hst: 21,
        title: 'Seleksi Cabang Produktif & Pengairan Parit',
        category: 'penyiraman',
        description: 'Pilih 2-3 cabang terkuat dan atur arah sulur rapi di atas jerami. Alirkan air ke parit bedengan selama 2 jam.',
        priority: 'medium'
      },
      {
        hst: 28,
        title: 'Penyerbukan Buatan Bunga Betina (Pagi Hari)',
        category: 'perawatan',
        description: 'Oleskan serbuk sari bunga jantan ke putik bunga betina pada daun ruas ke-12 s/d 16 pada pukul 06.00-09.00 pagi.',
        priority: 'high'
      },
      {
        hst: 35,
        title: 'Seleksi Calon Buah & Pasang Alas Buah',
        category: 'perawatan',
        description: 'Pilih 1-2 calon buah terbaik yang mulus simetris. Berikan alas bambu/jerami agar buah tidak bersentuhan dengan tanah becek.',
        priority: 'high'
      },
      {
        hst: 42,
        title: 'Penyiraman Kritis Pembesaran Buah & Kocor Kalium',
        category: 'penyiraman',
        description: 'FASE PEMBESARAN BUAH! Semangka sangat haus air pada fase ini. Siram parit rutin dan kocorkan pupuk KNO3 Putih + ZK.',
        dosageRecommendation: 'KNO3 Putih 5 gr/L + ZK 3 gr/L (400 ml/tanaman)',
        priority: 'high'
      },
      {
        hst: 52,
        title: 'Pembalikan Posisi Buah & Pengurangan Air Bertahap',
        category: 'perawatan',
        description: 'Balik posisi buah secara perlahan agar seluruh kulit terkena sinar matahari merata. Mulai kurangi penyiraman.',
        priority: 'medium'
      },
      {
        hst: 58,
        title: 'Penghentian Penyiraman (Fase Pemanisan & Brix Tinggi)',
        category: 'penyiraman',
        description: 'STOP PENYIRAMAN TOTAL 7 hari menjelang panen! Trik penting agar kadar gula brix naik tinggi, rasa manis renyah, dan buah tidak mudah busuk atau pecah.',
        priority: 'high'
      },
      {
        hst: 65,
        title: 'Panen Semangka Manis Berbobot',
        category: 'panen',
        description: 'Sulur di dekat tangkai buah telah mengering kecokelatan, warna kuning di dasar buah telah matang sempurna, dan bersuara berat saat dipukul.',
        priority: 'high'
      }
    ]
  }
];
