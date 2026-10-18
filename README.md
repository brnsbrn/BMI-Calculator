# BodyFit — Kalkulator BMI

Aplikasi statis HTML/CSS/JavaScript tanpa backend, database, atau login. Hanya fitur kalkulator yang tersedia; alamat lama rencana, progres, dan check-in mengarah ke kalkulator.

## Input dan hasil

Input: jenis kelamin, umur 18–80 tahun, berat (kg), tinggi (cm), lingkar pinggang dan panggul opsional (cm), serta target berat opsional (kg). Tinggi tetap wajib karena BMI tidak dapat dihitung dengan benar tanpa tinggi badan.

- **BMI** = berat (kg) / tinggi (m)². Kategori memakai nilai asli sebelum pembulatan: kurang <18,5; normal 18,5–<25; berlebih 25–<30; obesitas ≥30.
- **Estimasi lemak tubuh**: RFM untuk kedua jenis kelamin, `64 − 20 × tinggi/pinggang + 12 × sex` (pria=0, wanita=1). Tinggi dan pinggang dalam satuan sama. Jika pinggang kosong, rumus Deurenberg: `1,2 × BMI + 0,23 × umur − 10,8 × sex − 5,4` (pria=1, wanita=0). Nilai di luar rentang estimasi 1–60% ditampilkan sebagai tidak tersedia, tanpa menghalangi BMI.
- **BMR**: Mifflin–St Jeor, `10 × berat + 6,25 × tinggi − 5 × umur + konstanta` (pria +5, wanita −161). Ini energi saat istirahat, bukan kebutuhan kalori harian. Tidak ada asumsi tingkat aktivitas.
- **Rasio pinggang/panggul**: tersedia jika keduanya diisi. Ukur pinggang di atas tulang panggul setelah embusan napas normal; panggul pada bagian terlebar.
- **Target otomatis**: pertahankan berat saat ini bila BMI normal; jika di luar normal, gunakan batas terdekat rentang BMI 18,5–<25. Batas berat dibulatkan ke dalam rentang pada ketelitian 0,1 kg. Target ini acuan matematis, bukan resep medis. Target manual diteruskan, ditandai jika di luar rentang normal, dan ditolak jika meminta penurunan saat sudah kekurangan berat.

BMI hanya bergantung pada berat dan tinggi. Jenis kelamin, umur, pengukuran lingkar, dan target berat tidak mengubah BMI.

Referensi: [WHO: BMI dewasa](https://www.who.int/data/gho/data/themes/topics/indicator-groups/indicator-group-details/GHO/bmi-among-adults), [CDC: rumus BMI](https://www.cdc.gov/growth-chart-training/hcp/using-bmi/calculating-bmi.html), [RFM, Woolcott & Bergman 2018](https://pubmed.ncbi.nlm.nih.gov/30030479/), [Deurenberg 1991](https://pubmed.ncbi.nlm.nih.gov/2043597/).

## Menjalankan

ES Modules memerlukan server HTTP:

```bash
python -m http.server 8000
```

Buka <http://localhost:8000>.

## Penyimpanan

Hanya hasil kalkulator terakhir yang disimpan di `localStorage`, key `bodyfit_state`, format `{ version: 2, assessment }`. Jika penyimpanan diblokir/penuh, kalkulator tetap bekerja dalam memori. Tema memakai key terpisah `bodyfit-theme`.

Ekspor/impor JSON dan reset tersedia. Backup versi lama dapat diimpor: hanya input kalkulator yang digunakan, semua hasil dihitung ulang dengan rumus sekarang, dan data fitur yang sudah dihapus tidak diaktifkan kembali. Reset menghapus key data aplikasi; tema tetap tersimpan.

## Pengujian

```bash
npm test
```

Tes mencakup rumus, kategori sebelum pembulatan, target otomatis/manual, input opsional dan tidak valid, rasio lingkar, backup lama/baru, serta fallback penyimpanan.

Buka <http://localhost:8000/tests.html> untuk pengujian browser terhadap halaman kalkulator sebenarnya, termasuk navigasi, submit, hitung ulang, validasi, pemulihan backup, dan ukuran layar desktop/ponsel.
