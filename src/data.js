// Static reference data: goals, visual-portion foods, oil styles, exercise templates.

export const GOALS = {
  aggressive: { label: 'Aggressive Cut', sub: '−750 to −900 kcal/day', offset: -825, protein: 2.2, dir: -1 },
  moderate: { label: 'Moderate Cut', sub: '−400 to −500 kcal/day', offset: -450, protein: 2.0, dir: -1 },
  recomp: { label: 'Focused Fat Loss / Recomp', sub: '−250 kcal/day', offset: -250, protein: 2.0, dir: -1 },
  leanbulk: { label: 'Lean Bulk / Muscle Building', sub: '+250 to +350 kcal/day', offset: 300, protein: 1.8, dir: 1 },
  strength: { label: 'Pure Strength', sub: '+150 kcal/day', offset: 150, protein: 1.6, dir: 1 },
  figure: { label: 'Figure It Out', sub: '7-day diagnostic to find your real TDEE', offset: 0, protein: 1.8, dir: 0 },
};

export const OIL = [
  { key: 'air', label: 'Air-fried / Boiled', short: 'Air/Boil', sub: '+0g', kcal: 0 },
  { key: 'home', label: 'Home standard', short: 'Home', sub: '+1 tsp', kcal: 45 },
  { key: 'mess', label: 'Mess / Tiffin', short: 'Mess', sub: '+2 tsp', kcal: 90 },
  { key: 'dhaba', label: 'Restaurant / Dhaba gravy', short: 'Dhaba', sub: '+1 tbsp', kcal: 135 },
];
export const oilKcal = (k) => (OIL.find((o) => o.key === k) || OIL[1]).kcal;

export const SLOTS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'dinner', label: 'Dinner' },
];

export const FOOD_CATS = [
  { key: 'bread', label: 'Rotis' },
  { key: 'katori', label: 'Katori' },
  { key: 'protein', label: 'Protein' },
  { key: 'more', label: 'More' },
];

// Per visual unit. Base values exclude the meal's added cooking oil (handled by the oil toggle).
// step = how much one tap of +/- changes the quantity.
export const FOODS = [
  // Rotis / breads
  { id: 'phulka', cat: 'bread', name: 'Dry phulka', unit: '1 medium', kcal: 85, p: 3, step: 1 },
  { id: 'roti_ghee', cat: 'bread', name: 'Roti with ghee', unit: '1 roti + ½ tsp ghee', kcal: 105, p: 3, step: 1 },
  { id: 'paratha', cat: 'bread', name: 'Plain paratha', unit: '1 paratha', kcal: 200, p: 4.5, step: 1 },
  { id: 'aloo_paratha', cat: 'bread', name: 'Aloo paratha', unit: '1 paratha', kcal: 260, p: 5.5, step: 1 },
  { id: 'bread_white', cat: 'bread', name: 'White bread', unit: '1 slice', kcal: 70, p: 2.5, step: 1 },
  { id: 'bread_brown', cat: 'bread', name: 'Brown bread', unit: '1 slice', kcal: 65, p: 3, step: 1 },
  // Katori (~150 ml bowl)
  { id: 'rice_white', cat: 'katori', name: 'White rice (cooked)', unit: '1 katori', kcal: 155, p: 3, step: 0.5 },
  { id: 'rice_brown', cat: 'katori', name: 'Brown rice (cooked)', unit: '1 katori', kcal: 145, p: 3.3, step: 0.5 },
  { id: 'dal_thin', cat: 'katori', name: 'Thin home dal', unit: '1 katori', kcal: 110, p: 6, step: 0.5 },
  { id: 'dal_tadka', cat: 'katori', name: 'Thick dal tadka', unit: '1 katori', kcal: 180, p: 9, step: 0.5 },
  { id: 'rajma', cat: 'katori', name: 'Rajma', unit: '1 katori', kcal: 190, p: 10, step: 0.5 },
  { id: 'chole', cat: 'katori', name: 'Chole', unit: '1 katori', kcal: 210, p: 10, step: 0.5 },
  { id: 'dahi', cat: 'katori', name: 'Dahi / curd', unit: '1 katori', kcal: 95, p: 5, step: 0.5 },
  { id: 'paneer_bhurji', cat: 'katori', name: 'Paneer bhurji', unit: '1 katori', kcal: 290, p: 18, step: 0.5 },
  { id: 'sabzi', cat: 'katori', name: 'Mixed sabzi', unit: '1 katori', kcal: 80, p: 3, step: 0.5 },
  // Proteins
  { id: 'egg', cat: 'protein', name: 'Whole boiled egg', unit: '1 egg', kcal: 72, p: 6.3, step: 1 },
  { id: 'egg_white', cat: 'protein', name: 'Egg white', unit: '1 white', kcal: 17, p: 3.6, step: 1 },
  { id: 'milk_buffalo', cat: 'protein', name: 'Buffalo milk', unit: '1 glass (250 ml)', kcal: 245, p: 9.5, step: 0.5 },
  { id: 'milk_toned', cat: 'protein', name: 'Toned milk', unit: '1 glass (250 ml)', kcal: 150, p: 8, step: 0.5 },
  { id: 'milk_hp', cat: 'protein', name: 'High-protein milk', unit: '1 pack (250 ml)', kcal: 160, p: 20, step: 0.5 },
  { id: 'chicken_raw', cat: 'protein', name: 'Chicken breast (raw)', unit: 'palm-size piece ~100 g', kcal: 120, p: 23, step: 0.5 },
  { id: 'chicken_curry', cat: 'protein', name: 'Chicken curry piece', unit: '1 piece (bone-in)', kcal: 80, p: 9, step: 1 },
  { id: 'whey', cat: 'protein', name: 'Whey protein', unit: '1 scoop', kcal: 120, p: 24, step: 0.5 },
  { id: 'soya', cat: 'protein', name: 'Soya chunks (cooked)', unit: '1 katori (~50 g dry)', kcal: 170, p: 26, step: 0.5 },
  // More
  { id: 'poha', cat: 'more', name: 'Poha', unit: '1 katori', kcal: 180, p: 3.5, step: 0.5 },
  { id: 'upma', cat: 'more', name: 'Upma', unit: '1 katori', kcal: 190, p: 4.5, step: 0.5 },
  { id: 'idli', cat: 'more', name: 'Idli', unit: '1 idli', kcal: 58, p: 2, step: 1 },
  { id: 'dosa', cat: 'more', name: 'Plain dosa', unit: '1 dosa', kcal: 130, p: 3, step: 1 },
  { id: 'sprouts', cat: 'more', name: 'Moong sprouts', unit: '1 katori', kcal: 100, p: 7, step: 0.5 },
  { id: 'banana', cat: 'more', name: 'Banana', unit: '1 medium', kcal: 105, p: 1.3, step: 1 },
  { id: 'chai', cat: 'more', name: 'Chai with sugar', unit: '1 cup', kcal: 90, p: 2.5, step: 1 },
];

export const SPLITS = {
  Push: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Lateral Raise', 'Tricep Pushdown'],
  Pull: ['Deadlift', 'Barbell Row', 'Lat Pulldown', 'Seated Cable Row', 'Barbell Curl'],
  Legs: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'],
  Upper: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Pull-up', 'Dumbbell Curl'],
  Lower: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Walking Lunge', 'Calf Raise'],
  Arms: ['Barbell Curl', 'Close-Grip Bench Press', 'Hammer Curl', 'Skull Crusher', 'Tricep Pushdown'],
  'Full Body': ['Squat', 'Bench Press', 'Barbell Row', 'Overhead Press', 'Deadlift'],
};

const BARBELL = ['Bench Press', 'Overhead Press', 'Deadlift', 'Barbell Row', 'Barbell Curl', 'Squat', 'Romanian Deadlift',
  'Close-Grip Bench Press', 'Skull Crusher', 'Front Squat', 'Incline Bench Press', 'Hip Thrust', 'Shrug'];
export const isBarbell = (n) => BARBELL.includes(n) || /barbell|bench press|squat|deadlift/i.test(n) && !/dumbbell|machine|smith/i.test(n);

export const EXERCISE_LIBRARY = [...new Set([...Object.values(SPLITS).flat(), 'Front Squat', 'Incline Bench Press', 'Hip Thrust',
  'Shrug', 'Dips', 'Chin-up', 'Face Pull', 'Cable Fly', 'Leg Extension', 'Dumbbell Shoulder Press', 'Preacher Curl'])].sort();
