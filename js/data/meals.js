/**
 * meals.js — daftar makanan dasar untuk generator menu harian.
 * Di-port 1:1 dari config/recommendation.php (meal_foods).
 * Nilai kalori & makro per porsi sesuai field `serving`.
 */

export const MEAL_FOODS = {
  protein: [
    { name: 'Dada ayam panggang', serving: '100 g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Telur rebus', serving: '2 butir', calories: 143, protein: 12, carbs: 1, fat: 10 },
    { name: 'Ikan kembung bakar', serving: '100 g', calories: 120, protein: 20, carbs: 0, fat: 4 },
    { name: 'Tempe kukus', serving: '100 g', calories: 193, protein: 19, carbs: 9, fat: 11 },
    { name: 'Tahu putih', serving: '100 g', calories: 80, protein: 8, carbs: 1.5, fat: 4.5 },
    { name: 'Daging sapi tanpa lemak', serving: '100 g', calories: 150, protein: 26, carbs: 0, fat: 5 },
    { name: 'Udang rebus', serving: '100 g', calories: 85, protein: 18, carbs: 0, fat: 0.6 },
  ],
  carb: [
    { name: 'Nasi merah', serving: '150 g', calories: 165, protein: 3.5, carbs: 35, fat: 1.2 },
    { name: 'Nasi putih', serving: '150 g', calories: 195, protein: 4, carbs: 43, fat: 0.4 },
    { name: 'Kentang rebus', serving: '200 g', calories: 170, protein: 4.5, carbs: 39, fat: 0.2 },
    { name: 'Ubi rebus', serving: '150 g', calories: 160, protein: 2, carbs: 37, fat: 0.3 },
    { name: 'Oatmeal', serving: '40 g', calories: 150, protein: 5, carbs: 27, fat: 3 },
    { name: 'Roti gandum', serving: '2 lembar', calories: 160, protein: 8, carbs: 27, fat: 2.5 },
  ],
  veg: [
    { name: 'Brokoli kukus', serving: '100 g', calories: 35, protein: 2.4, carbs: 7, fat: 0.4 },
    { name: 'Bayam tumis', serving: '100 g', calories: 45, protein: 2.9, carbs: 4, fat: 2 },
    { name: 'Capcay', serving: '150 g', calories: 60, protein: 3, carbs: 10, fat: 1.5 },
    { name: 'Salad sayur + minyak zaitun', serving: '150 g', calories: 90, protein: 2, carbs: 8, fat: 6 },
    { name: 'Tumis kacang panjang', serving: '100 g', calories: 55, protein: 2.5, carbs: 8, fat: 1.2 },
  ],
  snack: [
    { name: 'Pisang', serving: '1 buah', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { name: 'Apel', serving: '1 buah', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { name: 'Yogurt plain', serving: '150 g', calories: 100, protein: 10, carbs: 8, fat: 3 },
    { name: 'Kacang almond', serving: '20 g', calories: 120, protein: 4.5, carbs: 4, fat: 10 },
    { name: 'Susu rendah lemak', serving: '250 ml', calories: 120, protein: 8, carbs: 12, fat: 5 },
    { name: 'Telur rebus', serving: '1 butir', calories: 72, protein: 6, carbs: 0.5, fat: 5 },
  ],
};

/**
 * Split kalori harian per sesi makan (5 sesi).
 */
export const MEAL_SPLITS = [
  { meal: 'Sarapan', share: 0.20, kind: 'main' },
  { meal: 'Snack', share: 0.10, kind: 'snack' },
  { meal: 'Makan Siang', share: 0.30, kind: 'main' },
  { meal: 'Snack Sore', share: 0.10, kind: 'snack' },
  { meal: 'Makan Malam', share: 0.30, kind: 'main' },
];