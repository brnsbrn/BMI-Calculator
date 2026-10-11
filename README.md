# BodyFit — Body Composition & Fitness Planner

Rewrite statis dari aplikasi referensi Laravel (`Bmi-Beta`) — **tanpa backend, tanpa database, tanpa login, tanpa framework UI**. Semua data diproses dan disimpan **lokal di browser** (`localStorage`).

## Fitur

- Kalkulator komposisi tubuh:
  - **Body fat** — pria: formula **US Navy (Hodgdon–Beckett)**; wanita: **RFM (Woolcott & Bergman 2018)**. Estimasi pria di luar rentang 1–60% ditolak dengan pesan pemeriksaan pengukuran, bukan dipaksa menjadi 1%; batas perhitungan wanita tetap 1–60%.
  - **BMI** (batas 18.5 / 25 / 30), **BMR** (Mifflin-St Jeor), **TDEE** (faktor aktivitas), **target berat** (otomatis dari target body fat, atau manual).
- Rekomendasi personal (rule 1:1 dari `config/recommendation.php`):
  - Target body fat + timeline per kategori.
  - Target kalori & makronutrien dengan safety floor **1200 kkal** dan penyesuaian target berat manual (±500 / ±350 / ±250 / 0).
  - **Contoh menu harian** 5 sesi (Sarapan 20% · Snack 10% · Makan Siang 30% · Snack Sore 10% · Makan Malam 30%), deterministik per profil.
  - **Jadwal latihan** mingguan (10 template), bisa dicentang per minggu.
- **Rencana** tersimpan: target, nutrisi, menu, jadwal latihan, Minggu berjalan.
- **Check-in mingguan**: berat (wajib), pinggang & body fat (opsional), latihan selesai, energi, kesulitan, catatan. Satu kali per minggu; setelah tersimpan Minggu berjalan naik.
- **Progres**: ringkasan (berat terakhir, perubahan, body fat, pinggang), **grafik SVG native** (tanpa CDN) untuk berat/body fat/pinggang + tooltip, riwayat check-in.
- **Backup JSON**: ekspor/impor (validasi schema + pratinjau sebelum mengganti data) dan reset data.
- Ramah aksesibilitas: label, fokus terlihat, Escape menutup dialog, fallback teks untuk grafik, sarana keyboard untuk audio.

## Menjalankan

ES Modules memerlukan server statis (buka lewat `file://` tidak dianjurkan):

```bash
# opsi 1 — Python
python -m http.server 8000

# opsi 2 — Node
npx serve .
```

Lalu buka <http://localhost:8000>.

## Struktur

```
index.html            Kalkulator (+ hasil & rekomendasi)
plan.html             Rencana Saya (nutrisi, menu, jadwal latihan)
progress.html         Progres (ringkasan, grafik SVG, riwayat)
check-in.html         Check-in mingguan
tests.html            Test browser (lihat bagian Testing)
css/                  Design system (11 file CSS)
js/
  app.js              Entry & router per halaman
  validation.js       Validasi form (kalkulator + check-in)
  storage.js          Persistence localStorage (satu key: bodyfit_state)
  state.js            State in-memory + mutasi (plan/check-in/workout)
  export-import.js    Backup JSON (ekspor/impor)
  format.js           Format angka & tanggal (id-ID)
  calculator/         Body fat, BMI, BMR, TDEE, target, safety, assessment
  data/               Recommendation rules, foods & split menu, templates latihan
  recommendation/     Engine rekomendasi, nutrisi, menu, jadwal
  charts/             Grafik garis SVG native
  ui/                 Ikon, modal, shell, UI per halaman
  tests/              Stub localStorage untuk test Node
node-test.mjs         Unit test inti (Node)
assets/images/logo.svg  Brand / favicon
```

## Formulas

| Metrik | Rumus |
| --- | --- |
| Body fat pria (US Navy) | `ρ = 1.0324 − 0.19077·log₁₀(pinggang−leher) + 0.15456·log₁₀(tinggi)` · `BF% = 495/ρ − 450` |
| Body fat wanita (RFM) | `BF% = 64 − 20·(tinggi/pinggang) + 12` |
| Body fat tanpa data lingkar lengkap (Deurenberg) | `BF% = 1.20·BMI + 0.23·umur − 10.8·sex − 5.4` (pria = 1, wanita = 0) |
| BMI | `berat / (tinggi(m))²` |
| BMR (Mifflin-St Jeor) | Pria: `10·bb + 6.25·tb − 5·u + 5` · Wanita: `10·bb + 6.25·tb − 5·u − 161` |
| TDEE | `BMR × faktor` (1.2 / 1.375 / 1.55 / 1.725 / 1.9) |
| Target berat | `massa tanpa lemak / (1 − target BF%)` |
| Kategori BF | `<6` sangat rendah · `6–<14` rendah · `14–<18` sedang · `18–<25` tinggi · `≥25` sangat tinggi |
| Kalori target | `TDEE + penyesuaian`, minimal **1200 kkal** |

Rumus densitas Navy memakai **sentimeter**, bukan inci, sesuai [laporan NHRC 84-11](https://doczz.net/doc/7924325/prediction-of-percent-body-fat-for-us-navy-men-from-body). RFM mengacu pada [Woolcott dan Bergman 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6054651/); fallback BMI mengacu pada [Deurenberg 1991](https://pubmed.ncbi.nlm.nih.gov/2043597/). BMI hanya bergantung pada berat dan tinggi; estimasi Navy/RFM dapat tetap sama bila hanya berat yang diubah tanpa mengubah ukuran lingkar. Lingkar panggul disimpan sebagai pengukuran tambahan, bukan input rumus ini. Kategori pemeliharaan mempertahankan berat saat ini jika tidak ada target manual.

Status berat badan dari BMI dipisahkan dari kategori lemak tubuh. Gauge memakai pita kategori sama lebar; marker diinterpolasi dalam pita yang sesuai agar sejajar dengan label. Untuk BMI di bawah 18,5 ([kategori CDC](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html)), target penurunan berat badan, defisit kalori, dan program latihan otomatis ditahan sampai penilaian tenaga kesehatan. Target berat manual yang lebih rendah dari berat saat ini ditolak. Estimasi TDEE tetap ditampilkan, bukan sebagai resep diet; lihat [panduan NHS mengenai berat badan kurang](https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/healthy-ways-to-gain-weight/).

## Penyimpanan data

- Satu root state di `localStorage` key `bodyfit_state` → `{ version, assessment, recommendation, plan, progress[], checkins[], workoutStatus{}, preferences }`.
- Struktur dinormalisasi saat dimuat; data korup diabaikan dan dimulai baru.
- Beberapa mutasi inti: `setAssessment`, `setRecommendation`, `savePlan` (memperbarui rencana tanpa mengulang minggu; baseline dan riwayat dipertahankan setelah check-in), `addCheckin` + `incrementWeek` (majukan Minggu), `toggleWorkout` (key `"<minggu>_<hari>"`).

## Testing

```bash
# Unit test inti engine & state (Node ≥ 20, butuh localStorage stub)
npm test          # → node node-test.mjs

# Test browser (jalankan server statis dulu)
# buka http://localhost:8000/tests.html
```

Cakupan:
- Rumus golden (body fat Navy/RFM, BMI, BMR, TDEE, target berat).
- Batas kategori & BMI (18.4→kurang … 30→obesitas; 5.9→sangat rendah … 25→sangat tinggi).
- Validasi rentang & relasi `pinggang > leher`.
- Nutrition: target kalori, floor 1200, komposisi makro ~100%.
- Menu deterministik (seed stabil), jadwal latihan, safety flag.
- State: buat/daftarkan rencana, check-in per minggu (duplikat dicegah), perubahan dari baseline, toggle latihan on/off, reset.
- Browser E2E: shell/nav/footer render, hydrate ikon, chart SVG + fallback, alur kalkulator → simpan rencana.

## Disclaimer

Estimasi body fat bersifat perkiraan (akurasi ±2–4%) dan hanya salah satu indikator kesehatan. Konsultasikan perubahan diet/latihan signifikan dengan profesional kesehatan.
