/**
 * workouts.js — template jadwal latihan mingguan.
 * Di-port 1:1 dari config/recommendation.php (workout_templates).
 * day_of_week: 1 = Senin ... 7 = Minggu.
 */

export const WORKOUT_TYPE_LABELS = {
  strength: 'Latihan Kekuatan',
  cardio: 'Kardio',
  recovery: 'Pemulihan',
  light: 'Aktivitas Ringan',
  rest: 'Istirahat',
};

export const WORKOUT_DAY_LABELS = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu',
};

export const WORKOUT_DAY_SHORT = {
  1: 'Sen',
  2: 'Sel',
  3: 'Rab',
  4: 'Kam',
  5: 'Jum',
  6: 'Sab',
  7: 'Min',
};

export const WORKOUT_TEMPLATES = {
  full_body_low_impact: {
    name: 'Full Body + Low Impact',
    days: [
      { day_of_week: 1, title: 'Full Body Strength', description: 'Latihan gabungan: squat, push-up, row, dan plank. 3 set × 10–12 repetisi.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 2, title: 'Low Impact Cardio', description: 'Jalan cepat, bersepeda santai, atau elliptical. Jaga intensitas ringan–sedang.', type: 'cardio', duration_minutes: 30 },
      { day_of_week: 3, title: 'Recovery', description: 'Peregangan dinamis dan mobilitas. Fokus pada area yang terasa kaku.', type: 'recovery', duration_minutes: 20 },
      { day_of_week: 4, title: 'Full Body Strength', description: 'Latihan gabungan: squat, push-up, row, dan plank. 3 set × 10–12 repetisi.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 5, title: 'Low Impact Cardio', description: 'Jalan cepat, bersepeda santai, atau elliptical. Jaga intensitas ringan–sedang.', type: 'cardio', duration_minutes: 30 },
      { day_of_week: 6, title: 'Light Activity', description: 'Jalan kaki santai 8.000–10.000 langkah atau aktivitas ringan di luar ruangan.', type: 'light', duration_minutes: 30 },
      { day_of_week: 7, title: 'Rest', description: 'Istirahat penuh untuk pemulihan.', type: 'rest', duration_minutes: 0 },
    ],
  },

  upper_lower_cardio: {
    name: 'Upper / Lower Split',
    days: [
      { day_of_week: 1, title: 'Upper Body Strength', description: 'Push, pull, dan press: bench press, row, dan shoulder press. 3–4 set × 8–12.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 2, title: 'Lower Body Strength', description: 'Squat, deadlift Romanian, lunge, dan calf raise. 3–4 set × 8–12.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 3, title: 'Moderate Cardio', description: 'Jogging atau bersepeda dengan intensitas sedang. Jaga ritme stabil.', type: 'cardio', duration_minutes: 30 },
      { day_of_week: 4, title: 'Upper Body Strength', description: 'Push, pull, dan press: bench press, row, dan shoulder press. 3–4 set × 8–12.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 5, title: 'Lower Body Strength', description: 'Squat, deadlift Romanian, lunge, dan calf raise. 3–4 set × 8–12.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 6, title: 'Light Activity / Cardio', description: 'Aktivitas ringan atau kardio santai yang Anda nikmati.', type: 'light', duration_minutes: 30 },
      { day_of_week: 7, title: 'Rest', description: 'Istirahat penuh untuk pemulihan.', type: 'rest', duration_minutes: 0 },
    ],
  },

  push_pull_legs: {
    name: 'Push / Pull / Legs',
    days: [
      { day_of_week: 1, title: 'Push', description: 'Chest, shoulders, triceps: bench press, overhead press, dan dips. 3–4 set × 8–12.', type: 'strength', duration_minutes: 50 },
      { day_of_week: 2, title: 'Pull', description: 'Back, biceps: deadlift, bent-over row, dan curls. 3–4 set × 8–12.', type: 'strength', duration_minutes: 50 },
      { day_of_week: 3, title: 'Legs + Core', description: 'Squat, leg press, dan plank. 3–4 set × 8–12.', type: 'strength', duration_minutes: 50 },
      { day_of_week: 4, title: 'Full Body Ringan', description: 'Rangkaian latihan seluruh tubuh dengan intensitas ringan atau recovery aktif.', type: 'light', duration_minutes: 30 },
      { day_of_week: 5, title: 'Push', description: 'Chest, shoulders, triceps: bench press, overhead press, dan dips. 3–4 set × 8–12.', type: 'strength', duration_minutes: 50 },
      { day_of_week: 6, title: 'Kardio Rekreasional', description: 'Aktivitas yang Anda nikmati: berenang, bersepeda, atau olahraga tim.', type: 'cardio', duration_minutes: 40 },
      { day_of_week: 7, title: 'Rest', description: 'Istirahat penuh untuk pemulihan.', type: 'rest', duration_minutes: 0 },
    ],
  },

  upper_lower_light: {
    name: 'Upper/Lower + Performa',
    days: [
      { day_of_week: 1, title: 'Upper Body Strength', description: 'Push, pull, dan press dengan fokus pada kekuatan. 3–4 set × 6–10.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 2, title: 'Lower Body Strength', description: 'Squat, deadlift, dan lunge. 3–4 set × 6–10.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 3, title: 'Light Cardio', description: 'Kardio ringan singkat untuk menjaga kebugaran tanpa mengganggu recovery.', type: 'cardio', duration_minutes: 25 },
      { day_of_week: 4, title: 'Upper Body Strength', description: 'Push, pull, dan press dengan fokus pada kekuatan. 3–4 set × 6–10.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 5, title: 'Lower Body Strength', description: 'Squat, deadlift, dan lunge. 3–4 set × 6–10.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 6, title: 'Sprint / Performa', description: 'Sesi singkat intensitas tinggi (sprint atau interval pendek) untuk performa.', type: 'cardio', duration_minutes: 20 },
      { day_of_week: 7, title: 'Rest', description: 'Istirahat penuh untuk pemulihan.', type: 'rest', duration_minutes: 0 },
    ],
  },

  recovery_focus: {
    name: 'Recovery Focus',
    days: [
      { day_of_week: 1, title: 'Recovery & Mobilitas', description: 'Peregangan, foam rolling, dan mobilitas sendi.', type: 'recovery', duration_minutes: 20 },
      { day_of_week: 2, title: 'Full Body Ringan', description: 'Latihan kekuatan dengan intensitas rendah, 2–3 set × 10–12.', type: 'strength', duration_minutes: 30 },
      { day_of_week: 3, title: 'Recovery', description: 'Peregangan dinamis dan teknik pernapasan.', type: 'recovery', duration_minutes: 20 },
      { day_of_week: 4, title: 'Full Body Ringan', description: 'Latihan kekuatan dengan intensitas rendah, 2–3 set × 10–12.', type: 'strength', duration_minutes: 30 },
      { day_of_week: 5, title: 'Recovery & Mobilitas', description: 'Peregangan, foam rolling, dan mobilitas sendi.', type: 'recovery', duration_minutes: 20 },
      { day_of_week: 6, title: 'Rest', description: 'Istirahat penuh.', type: 'rest', duration_minutes: 0 },
      { day_of_week: 7, title: 'Rest', description: 'Istirahat penuh.', type: 'rest', duration_minutes: 0 },
    ],
  },

  full_body_low_impact_f: {
    name: 'Full Body + Low Impact',
    days: [
      { day_of_week: 1, title: 'Full Body Strength', description: 'Latihan gabungan: squat, push-up (modifikasi), row, dan plank. 3 set × 10–12 repetisi.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 2, title: 'Low Impact Cardio', description: 'Jalan cepat, bersepeda santai, atau elliptical. Jaga intensitas ringan–sedang.', type: 'cardio', duration_minutes: 30 },
      { day_of_week: 3, title: 'Recovery', description: 'Peregangan dinamis dan mobilitas. Fokus pada area yang terasa kaku.', type: 'recovery', duration_minutes: 20 },
      { day_of_week: 4, title: 'Full Body Strength', description: 'Latihan gabungan: squat, push-up (modifikasi), row, dan plank. 3 set × 10–12 repetisi.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 5, title: 'Low Impact Cardio', description: 'Jalan cepat, bersepeda santai, atau elliptical. Jaga intensitas ringan–sedang.', type: 'cardio', duration_minutes: 30 },
      { day_of_week: 6, title: 'Light Activity', description: 'Jalan kaki santai 8.000–10.000 langkah atau aktivitas ringan di luar ruangan.', type: 'light', duration_minutes: 30 },
      { day_of_week: 7, title: 'Rest', description: 'Istirahat penuh untuk pemulihan.', type: 'rest', duration_minutes: 0 },
    ],
  },

  upper_lower_core_hiit: {
    name: 'Upper/Lower + Core + HIIT',
    days: [
      { day_of_week: 1, title: 'Lower Body + Core', description: 'Squat, lunge, glute bridge, dan plank. 3 set × 12–15.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 2, title: 'Upper Body Strength', description: 'Push-up, row, dan shoulder press. 3 set × 10–12.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 3, title: 'HIIT Singkat', description: 'Interval intensitas tinggi singkat: 20 detik kerja / 40 detik istirahat.', type: 'cardio', duration_minutes: 20 },
      { day_of_week: 4, title: 'Lower Body + Core', description: 'Squat, lunge, glute bridge, dan plank. 3 set × 12–15.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 5, title: 'Upper Body Strength', description: 'Push-up, row, dan shoulder press. 3 set × 10–12.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 6, title: 'Core + Light Cardio', description: 'Rangkaian core dan kardio ringan yang menyenangkan.', type: 'light', duration_minutes: 30 },
      { day_of_week: 7, title: 'Rest', description: 'Istirahat penuh untuk pemulihan.', type: 'rest', duration_minutes: 0 },
    ],
  },

  full_body_recreational_f: {
    name: 'Full Body + Rekreasi',
    days: [
      { day_of_week: 1, title: 'Full Body Strength', description: 'Gabungan latihan kekuatan seluruh tubuh, 3 set × 12 repetisi.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 2, title: 'Active Recovery', description: 'Peregangan atau yoga ringan.', type: 'recovery', duration_minutes: 25 },
      { day_of_week: 3, title: 'Full Body Strength', description: 'Gabungan latihan kekuatan seluruh tubuh, 3 set × 12 repetisi.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 4, title: 'Kardio Rekreasional', description: 'Berenang, bersepeda, atau jalan cepat yang Anda nikmati.', type: 'cardio', duration_minutes: 35 },
      { day_of_week: 5, title: 'Full Body Strength', description: 'Gabungan latihan kekuatan seluruh tubuh, 3 set × 12 repetisi.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 6, title: 'Light Activity', description: 'Aktivitas santai di luar ruangan.', type: 'light', duration_minutes: 30 },
      { day_of_week: 7, title: 'Rest', description: 'Istirahat penuh untuk pemulihan.', type: 'rest', duration_minutes: 0 },
    ],
  },

  lower_upper_full_body_perf: {
    name: 'Lower/Upper/Full Body + Performa',
    days: [
      { day_of_week: 1, title: 'Lower Body', description: 'Squat, hip thrust, dan lunge. 3–4 set × 8–12.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 2, title: 'Upper Body', description: 'Push, pull, dan core. 3–4 set × 8–12.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 3, title: 'Full Body', description: 'Latihan gabungan seluruh tubuh dengan intensitas sedang.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 4, title: 'Aktivitas Performa', description: 'Olahraga atau aktivitas yang Anda tekuni: lari, renang, atau olahraga tim.', type: 'cardio', duration_minutes: 40 },
      { day_of_week: 5, title: 'Lower Body', description: 'Squat, hip thrust, dan lunge. 3–4 set × 8–12.', type: 'strength', duration_minutes: 45 },
      { day_of_week: 6, title: 'Light Activity', description: 'Aktivitas santai yang Anda nikmati.', type: 'light', duration_minutes: 30 },
      { day_of_week: 7, title: 'Rest', description: 'Istirahat penuh untuk pemulihan.', type: 'rest', duration_minutes: 0 },
    ],
  },

  recovery_focus_f: {
    name: 'Recovery Focus',
    days: [
      { day_of_week: 1, title: 'Recovery & Mobilitas', description: 'Peregangan, foam rolling, dan mobilitas sendi.', type: 'recovery', duration_minutes: 20 },
      { day_of_week: 2, title: 'Full Body Ringan', description: 'Latihan kekuatan dengan intensitas rendah, 2–3 set × 10–12.', type: 'strength', duration_minutes: 30 },
      { day_of_week: 3, title: 'Recovery', description: 'Peregangan dinamis dan teknik pernapasan.', type: 'recovery', duration_minutes: 20 },
      { day_of_week: 4, title: 'Full Body Ringan', description: 'Latihan kekuatan dengan intensitas rendah, 2–3 set × 10–12.', type: 'strength', duration_minutes: 30 },
      { day_of_week: 5, title: 'Recovery & Mobilitas', description: 'Peregangan, foam rolling, dan mobilitas sendi.', type: 'recovery', duration_minutes: 20 },
      { day_of_week: 6, title: 'Rest', description: 'Istirahat penuh.', type: 'rest', duration_minutes: 0 },
      { day_of_week: 7, title: 'Rest', description: 'Istirahat penuh.', type: 'rest', duration_minutes: 0 },
    ],
  },
};