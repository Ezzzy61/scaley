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
  { key: 'local', label: 'Local' },
  { key: 'bread', label: 'Rotis' },
  { key: 'katori', label: 'Katori' },
  { key: 'protein', label: 'Protein' },
  { key: 'more', label: 'More' },
  { key: 'street', label: 'Street & snacks' },
  { key: 'raw', label: 'Raw (100 g)' },
];

// Per visual unit. Base values exclude the meal's added cooking oil (handled by the oil toggle).
// step = how much one tap of +/- changes the quantity.
export const FOODS = [
  // Rotis / breads
  { id: 'phulka', cat: 'bread', name: 'Dry phulka', unit: '1 medium', kcal: 85, p: 3, c: 17, f: 0.5, step: 1 },
  { id: 'roti_ghee', cat: 'bread', name: 'Roti with ghee', unit: '1 roti + ½ tsp ghee', kcal: 105, p: 3, c: 17, f: 3, step: 1 },
  { id: 'paratha', cat: 'bread', name: 'Plain paratha', unit: '1 paratha', kcal: 200, p: 4.5, c: 28, f: 8, step: 1 },
  { id: 'aloo_paratha', cat: 'bread', name: 'Aloo paratha', unit: '1 paratha', kcal: 260, p: 5.5, c: 38, f: 9, step: 1 },
  { id: 'bread_white', cat: 'bread', name: 'White bread', unit: '1 slice', kcal: 70, p: 2.5, c: 13, f: 1, step: 1 },
  { id: 'bread_brown', cat: 'bread', name: 'Brown bread', unit: '1 slice', kcal: 65, p: 3, c: 12, f: 1, step: 1 },
  // Katori (~150 ml bowl)
  { id: 'rice_white', cat: 'katori', name: 'White rice (cooked)', unit: '1 katori', kcal: 155, p: 3, c: 34, f: 0.4, step: 0.5 },
  { id: 'rice_brown', cat: 'katori', name: 'Brown rice (cooked)', unit: '1 katori', kcal: 145, p: 3.3, c: 30, f: 1.2, step: 0.5 },
  { id: 'dal_thin', cat: 'katori', name: 'Thin home dal', unit: '1 katori', kcal: 110, p: 6, c: 16, f: 1.5, step: 0.5 },
  { id: 'dal_tadka', cat: 'katori', name: 'Thick dal tadka', unit: '1 katori', kcal: 180, p: 9, c: 22, f: 6, step: 0.5 },
  { id: 'rajma', cat: 'katori', name: 'Rajma', unit: '1 katori', kcal: 190, p: 10, c: 28, f: 4, step: 0.5 },
  { id: 'chole', cat: 'katori', name: 'Chole', unit: '1 katori', kcal: 210, p: 10, c: 30, f: 5, step: 0.5 },
  { id: 'dahi', cat: 'katori', name: 'Dahi / curd', unit: '1 katori', kcal: 95, p: 5, c: 7, f: 5, step: 0.5 },
  { id: 'paneer_bhurji', cat: 'katori', name: 'Paneer bhurji', unit: '1 katori', kcal: 290, p: 18, c: 8, f: 20, step: 0.5 },
  { id: 'sabzi', cat: 'katori', name: 'Mixed sabzi', unit: '1 katori', kcal: 80, p: 3, c: 10, f: 3, step: 0.5 },
  // Proteins
  { id: 'egg', cat: 'protein', name: 'Whole boiled egg', unit: '1 egg', kcal: 72, p: 6.3, c: 0.4, f: 5, step: 1 },
  { id: 'egg_white', cat: 'protein', name: 'Egg white', unit: '1 white', kcal: 17, p: 3.6, c: 0.2, f: 0, step: 1 },
  { id: 'milk_buffalo', cat: 'protein', name: 'Buffalo milk', unit: '1 glass (250 ml)', kcal: 245, p: 9.5, c: 13, f: 17, step: 0.5 },
  { id: 'milk_toned', cat: 'protein', name: 'Toned milk', unit: '1 glass (250 ml)', kcal: 150, p: 8, c: 12, f: 7.5, step: 0.5 },
  { id: 'milk_hp', cat: 'protein', name: 'High-protein milk', unit: '1 pack (250 ml)', kcal: 160, p: 20, c: 12, f: 4, step: 0.5 },
  { id: 'chicken_raw', cat: 'protein', name: 'Chicken breast (raw)', unit: 'palm-size piece ~100 g', kcal: 120, p: 23, c: 0, f: 2.5, step: 0.5 },
  { id: 'chicken_curry', cat: 'protein', name: 'Chicken curry piece', unit: '1 piece (bone-in)', kcal: 80, p: 9, c: 1, f: 4, step: 1 },
  { id: 'whey', cat: 'protein', name: 'Whey protein', unit: '1 scoop', kcal: 120, p: 24, c: 3, f: 1.5, step: 0.5 },
  { id: 'soya', cat: 'protein', name: 'Soya chunks (cooked)', unit: '1 katori (~50 g dry)', kcal: 170, p: 26, c: 17, f: 0.5, step: 0.5 },
  // More
  { id: 'poha', cat: 'more', name: 'Poha', unit: '1 katori', kcal: 180, p: 3.5, c: 32, f: 4, step: 0.5 },
  { id: 'upma', cat: 'more', name: 'Upma', unit: '1 katori', kcal: 190, p: 4.5, c: 28, f: 6, step: 0.5 },
  { id: 'idli', cat: 'more', name: 'Idli', unit: '1 idli', kcal: 58, p: 2, c: 12, f: 0.2, step: 1 },
  { id: 'dosa', cat: 'more', name: 'Plain dosa', unit: '1 dosa', kcal: 130, p: 3, c: 20, f: 4, step: 1 },
  { id: 'sprouts', cat: 'more', name: 'Moong sprouts', unit: '1 katori', kcal: 100, p: 7, c: 15, f: 0.5, step: 0.5 },
  { id: 'banana', cat: 'more', name: 'Banana', unit: '1 medium', kcal: 105, p: 1.3, c: 27, f: 0.4, step: 1 },
  { id: 'chai', cat: 'more', name: 'Chai with sugar', unit: '1 cup', kcal: 90, p: 2.5, c: 13, f: 3, step: 1 },
  // Regional (r = food regions: MH, N, S, E, W, ALL)
  { id: 'vada_pav', cat: 'street', r: ['MH'], name: 'Vada pav', unit: '1 piece', kcal: 290, p: 6, c: 40, f: 12, step: 1 },
  { id: 'misal_pav', cat: 'street', r: ['MH'], name: 'Misal pav', unit: '1 plate (2 pav)', kcal: 470, p: 15, c: 60, f: 18, step: 0.5 },
  { id: 'pav_bhaji', cat: 'street', r: ['MH', 'ALL'], name: 'Pav bhaji', unit: '1 plate (2 pav)', kcal: 500, p: 11, c: 65, f: 22, step: 0.5 },
  { id: 'sabudana_khichdi', cat: 'more', r: ['MH', 'W'], name: 'Sabudana khichdi', unit: '1 katori', kcal: 300, p: 4, c: 55, f: 8, step: 0.5 },
  { id: 'thalipeeth', cat: 'bread', r: ['MH'], name: 'Thalipeeth', unit: '1 piece', kcal: 180, p: 5, c: 25, f: 7, step: 1 },
  { id: 'chole_bhature', cat: 'street', r: ['N'], name: 'Chole bhature', unit: '1 plate (2 bhature)', kcal: 650, p: 17, c: 75, f: 32, step: 0.5 },
  { id: 'samosa', cat: 'street', r: ['N', 'ALL'], name: 'Samosa', unit: '1 piece', kcal: 250, p: 4, c: 27, f: 14, step: 1 },
  { id: 'kachori', cat: 'street', r: ['N', 'W'], name: 'Kachori', unit: '1 piece', kcal: 190, p: 4, c: 20, f: 10, step: 1 },
  { id: 'butter_chicken', cat: 'protein', r: ['N'], name: 'Butter chicken', unit: '1 katori', kcal: 350, p: 25, c: 10, f: 24, step: 0.5 },
  { id: 'dal_makhani', cat: 'katori', r: ['N'], name: 'Dal makhani', unit: '1 katori', kcal: 280, p: 10, c: 25, f: 16, step: 0.5 },
  { id: 'lassi', cat: 'more', r: ['N'], name: 'Sweet lassi', unit: '1 glass (250 ml)', kcal: 220, p: 7, c: 30, f: 8, step: 0.5 },
  { id: 'masala_dosa', cat: 'more', r: ['S'], name: 'Masala dosa', unit: '1 dosa', kcal: 330, p: 7, c: 45, f: 13, step: 1 },
  { id: 'medu_vada', cat: 'street', r: ['S'], name: 'Medu vada', unit: '1 piece', kcal: 140, p: 4, c: 14, f: 8, step: 1 },
  { id: 'sambar', cat: 'katori', r: ['S'], name: 'Sambar', unit: '1 katori', kcal: 110, p: 5, c: 15, f: 3, step: 0.5 },
  { id: 'curd_rice', cat: 'katori', r: ['S'], name: 'Curd rice', unit: '1 katori', kcal: 190, p: 5, c: 30, f: 5, step: 0.5 },
  { id: 'pongal', cat: 'katori', r: ['S'], name: 'Ven pongal', unit: '1 katori', kcal: 220, p: 6, c: 30, f: 8, step: 0.5 },
  { id: 'appam', cat: 'bread', r: ['S'], name: 'Appam', unit: '1 appam', kcal: 120, p: 2, c: 23, f: 2, step: 1 },
  { id: 'fish_curry', cat: 'protein', r: ['S', 'E', 'MH'], name: 'Fish curry', unit: '1 katori (2 pieces)', kcal: 200, p: 20, c: 6, f: 11, step: 0.5 },
  { id: 'chicken_biryani', cat: 'more', r: ['S', 'ALL'], name: 'Chicken biryani', unit: '1 plate', kcal: 550, p: 25, c: 65, f: 20, step: 0.5 },
  { id: 'filter_coffee', cat: 'more', r: ['S'], name: 'Filter coffee', unit: '1 tumbler', kcal: 100, p: 3, c: 12, f: 4, step: 1 },
  { id: 'luchi', cat: 'bread', r: ['E'], name: 'Luchi', unit: '1 luchi', kcal: 110, p: 2, c: 12, f: 6, step: 1 },
  { id: 'rosogolla', cat: 'street', r: ['E'], name: 'Rosogolla', unit: '1 piece', kcal: 125, p: 3, c: 27, f: 0.5, step: 1 },
  { id: 'litti_chokha', cat: 'more', r: ['E'], name: 'Litti chokha', unit: '2 litti + chokha', kcal: 420, p: 12, c: 60, f: 14, step: 0.5 },
  { id: 'momos_veg', cat: 'street', r: ['E', 'N', 'ALL'], name: 'Veg momos (steamed)', unit: '6 pieces', kcal: 250, p: 8, c: 40, f: 5, step: 0.5 },
  { id: 'momos_chicken', cat: 'street', r: ['E', 'N', 'ALL'], name: 'Chicken momos (steamed)', unit: '6 pieces', kcal: 300, p: 15, c: 36, f: 9, step: 0.5 },
  { id: 'dhokla', cat: 'more', r: ['W'], name: 'Dhokla', unit: '2 pieces', kcal: 150, p: 6, c: 22, f: 4, step: 1 },
  { id: 'thepla', cat: 'bread', r: ['W'], name: 'Thepla', unit: '1 thepla', kcal: 120, p: 3, c: 16, f: 5, step: 1 },
  { id: 'dal_baati', cat: 'more', r: ['W'], name: 'Dal baati', unit: '1 baati + dal', kcal: 450, p: 12, c: 50, f: 22, step: 0.5 },
  { id: 'khakhra', cat: 'bread', r: ['W'], name: 'Khakhra', unit: '1 piece', kcal: 60, p: 2, c: 9, f: 2, step: 1 },
  { id: 'maggi', cat: 'street', r: ['ALL'], name: 'Maggi', unit: '1 pack', kcal: 350, p: 8, c: 48, f: 14, step: 0.5 },
  { id: 'peanuts', cat: 'protein', r: ['ALL'], name: 'Roasted peanuts', unit: '1 handful (~30 g)', kcal: 170, p: 7, c: 5, f: 14, step: 0.5 },
  { id: 'chana', cat: 'protein', r: ['ALL'], name: 'Roasted chana', unit: '1 handful (~30 g)', kcal: 110, p: 6, c: 18, f: 2, step: 0.5 },
  { id: 'sattu', cat: 'protein', r: ['E', 'N'], name: 'Sattu drink', unit: '1 glass (2 tbsp)', kcal: 150, p: 8, c: 22, f: 2, step: 0.5 },
  { id: 'coconut_water', cat: 'more', r: ['S', 'ALL'], name: 'Tender coconut water', unit: '1 coconut', kcal: 45, p: 0.5, c: 11, f: 0, step: 1 },
  { id: 'sugarcane', cat: 'street', r: ['ALL'], name: 'Sugarcane juice', unit: '1 glass', kcal: 180, p: 0, c: 45, f: 0, step: 0.5 },
  // Raw ingredients per 100 g (approximate, IFCT 2017-style values) for people who weigh food or cook from scratch.
  { id: 'raw_atta', cat: 'raw', name: 'Whole wheat atta', unit: '100 g', kcal: 320, p: 10.6, c: 64, f: 1.7, step: 0.25 },
  { id: 'raw_rice', cat: 'raw', name: 'Rice (raw)', unit: '100 g', kcal: 356, p: 7.9, c: 78, f: 0.5, step: 0.25 },
  { id: 'raw_poha', cat: 'raw', name: 'Poha (raw)', unit: '100 g', kcal: 346, p: 6.6, c: 77, f: 1.2, step: 0.25 },
  { id: 'raw_oats', cat: 'raw', name: 'Rolled oats', unit: '100 g', kcal: 379, p: 13, c: 66, f: 6.5, step: 0.25 },
  { id: 'raw_besan', cat: 'raw', name: 'Besan', unit: '100 g', kcal: 360, p: 21, c: 58, f: 5.6, step: 0.25 },
  { id: 'raw_sattu', cat: 'raw', name: 'Chana sattu', unit: '100 g', kcal: 395, p: 20, c: 64, f: 5.5, step: 0.25 },
  { id: 'raw_ragi', cat: 'raw', name: 'Ragi flour', unit: '100 g', kcal: 320, p: 7.2, c: 66, f: 1.9, step: 0.25 },
  { id: 'raw_jowar', cat: 'raw', name: 'Jowar flour', unit: '100 g', kcal: 334, p: 10, c: 67, f: 1.7, step: 0.25 },
  { id: 'raw_bajra', cat: 'raw', name: 'Bajra flour', unit: '100 g', kcal: 348, p: 11, c: 61, f: 5.4, step: 0.25 },
  { id: 'raw_moong', cat: 'raw', name: 'Moong dal (raw)', unit: '100 g', kcal: 326, p: 24, c: 56, f: 1.4, step: 0.25 },
  { id: 'raw_toor', cat: 'raw', name: 'Toor/arhar dal (raw)', unit: '100 g', kcal: 335, p: 22, c: 58, f: 1.5, step: 0.25 },
  { id: 'raw_masoor', cat: 'raw', name: 'Masoor dal (raw)', unit: '100 g', kcal: 322, p: 24.4, c: 54, f: 0.8, step: 0.25 },
  { id: 'raw_chanadal', cat: 'raw', name: 'Chana dal (raw)', unit: '100 g', kcal: 360, p: 21, c: 59, f: 5.3, step: 0.25 },
  { id: 'raw_kabuli', cat: 'raw', name: 'Kabuli chana (raw)', unit: '100 g', kcal: 335, p: 18.8, c: 55, f: 6, step: 0.25 },
  { id: 'raw_rajma', cat: 'raw', name: 'Rajma (raw)', unit: '100 g', kcal: 300, p: 20, c: 49, f: 1.6, step: 0.25 },
  { id: 'raw_soya', cat: 'raw', name: 'Soya chunks', unit: '100 g', kcal: 345, p: 52, c: 33, f: 0.5, step: 0.25 },
  { id: 'raw_paneer', cat: 'raw', name: 'Paneer (full fat)', unit: '100 g', kcal: 265, p: 18.3, c: 1.2, f: 20.8, step: 0.25 },
  { id: 'raw_tofu', cat: 'raw', name: 'Tofu (firm)', unit: '100 g', kcal: 80, p: 8.5, c: 2, f: 4.5, step: 0.25 },
  { id: 'raw_curd', cat: 'raw', name: 'Curd (cow milk)', unit: '100 g', kcal: 60, p: 3.1, c: 3, f: 4, step: 0.25 },
  { id: 'raw_greek', cat: 'raw', name: 'Hung curd / Greek yogurt', unit: '100 g', kcal: 97, p: 9, c: 4, f: 5, step: 0.25 },
  { id: 'raw_milk', cat: 'raw', name: 'Toned milk (100 ml)', unit: '100 g', kcal: 58, p: 3.1, c: 4.7, f: 3, step: 0.25 },
  { id: 'raw_chicken', cat: 'raw', name: 'Chicken breast (raw)', unit: '100 g', kcal: 120, p: 22.5, c: 0, f: 2.6, step: 0.25 },
  { id: 'raw_chickcurry', cat: 'raw', name: 'Chicken curry cut (raw)', unit: '100 g', kcal: 190, p: 18, c: 0, f: 12.5, step: 0.25 },
  { id: 'raw_mutton', cat: 'raw', name: 'Mutton (raw)', unit: '100 g', kcal: 194, p: 18.5, c: 0, f: 13, step: 0.25 },
  { id: 'raw_rohu', cat: 'raw', name: 'Rohu / fish (raw)', unit: '100 g', kcal: 97, p: 16.6, c: 0, f: 1.4, step: 0.25 },
  { id: 'raw_prawn', cat: 'raw', name: 'Prawns (raw)', unit: '100 g', kcal: 85, p: 19, c: 0, f: 1, step: 0.25 },
  { id: 'raw_egg', cat: 'raw', name: 'Egg (whole, raw)', unit: '100 g', kcal: 143, p: 12.6, c: 0.7, f: 9.5, step: 0.25 },
  { id: 'raw_peanut', cat: 'raw', name: 'Peanuts', unit: '100 g', kcal: 567, p: 25.8, c: 16, f: 49, step: 0.25 },
  { id: 'raw_almond', cat: 'raw', name: 'Almonds', unit: '100 g', kcal: 579, p: 21, c: 22, f: 50, step: 0.25 },
  { id: 'raw_makhana', cat: 'raw', name: 'Makhana', unit: '100 g', kcal: 347, p: 9.7, c: 77, f: 0.1, step: 0.25 },
  { id: 'raw_potato', cat: 'raw', name: 'Potato (raw)', unit: '100 g', kcal: 80, p: 1.6, c: 18, f: 0.1, step: 0.25 },
  { id: 'raw_sweetpot', cat: 'raw', name: 'Sweet potato (raw)', unit: '100 g', kcal: 86, p: 1.6, c: 20, f: 0.1, step: 0.25 },
  { id: 'raw_banana', cat: 'raw', name: 'Banana (flesh)', unit: '100 g', kcal: 89, p: 1.1, c: 23, f: 0.3, step: 0.25 },
  { id: 'raw_ghee', cat: 'raw', name: 'Ghee', unit: '100 g', kcal: 900, p: 0, c: 0, f: 100, step: 0.25 },
  { id: 'raw_oil', cat: 'raw', name: 'Cooking oil (any)', unit: '100 g', kcal: 900, p: 0, c: 0, f: 100, step: 0.25 },
  { id: 'raw_sugar', cat: 'raw', name: 'Sugar / jaggery', unit: '100 g', kcal: 387, p: 0, c: 100, f: 0, step: 0.25 },
  { id: 'raw_whey', cat: 'raw', name: 'Whey protein (scoop ~30 g = 0.3)', unit: '100 g', kcal: 400, p: 78, c: 9, f: 5, step: 0.25 },
];

export const foodsForRegion = (region) => FOODS.filter((f) => f.r && (f.r.includes(region) || (region === 'ALL' && f.r.includes('ALL'))));


export const SPLITS = {
  Push: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Lateral Raise', 'Tricep Pushdown'],
  Pull: ['Deadlift', 'Barbell Row', 'Lat Pulldown', 'Seated Cable Row', 'Barbell Curl'],
  Legs: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'],
  Upper: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Pull-up', 'Dumbbell Curl'],
  Lower: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Walking Lunge', 'Calf Raise'],
  Arms: ['Barbell Curl', 'Close-Grip Bench Press', 'Hammer Curl', 'Skull Crusher', 'Tricep Pushdown'],
  'Full Body': ['Squat', 'Bench Press', 'Barbell Row', 'Overhead Press', 'Deadlift'],
  'Full Body A': ['Goblet Squat', 'Incline Push-up', 'Dumbbell Row', 'Romanian Deadlift', 'Plank (sec)'],
  'Full Body B': ['Squat', 'Bench Press', 'Lat Pulldown', 'Hip Thrust', 'Farmer Carry (m)'],
  'Chest + Triceps': ['Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Dips', 'Tricep Pushdown', 'Skull Crusher'],
  'Back + Biceps': ['Deadlift', 'Lat Pulldown', 'Barbell Row', 'Seated Cable Row', 'Barbell Curl', 'Hammer Curl'],
  Shoulders: ['Overhead Press', 'Dumbbell Shoulder Press', 'Lateral Raise', 'Face Pull', 'Shrug'],
  'Home Bodyweight': ['Push-up', 'Bodyweight Squat', 'Chair Dips', 'Reverse Lunge', 'Glute Bridge', 'Plank (sec)'],
  'Desi Akhada': ['Hindu Push-up (Dand)', 'Hindu Squat (Baithak)', 'Pull-up', 'Mudgar / Gada Swings', 'Rope Climb / Towel Hang (sec)'],
  'Surya Namaskar Flow': ['Surya Namaskar (rounds)', 'Plank (sec)', 'Bhujangasana Hold (sec)', 'Malasana Hold (sec)'],
  'Healthy Ageing': ['Sit-to-Stand (chair)', 'Wall Push-up', 'Band Row', 'Step-up (low)', 'Single-leg Balance (sec)', 'Farmer Carry (m)'],
  'Joint-friendly': ['Box Squat', 'Glute Bridge', 'Neutral-grip DB Press', 'Chest-supported Row', 'Bird Dog', 'Dead Bug'],
};
export const POPULAR_SPLITS = ['Chest + Triceps', 'Back + Biceps', 'Shoulders', 'Home Bodyweight', 'Desi Akhada', 'Surya Namaskar Flow', 'Full Body A', 'Full Body B', 'Healthy Ageing', 'Joint-friendly'];

const BARBELL = ['Bench Press', 'Overhead Press', 'Deadlift', 'Barbell Row', 'Barbell Curl', 'Squat', 'Romanian Deadlift',
  'Close-Grip Bench Press', 'Skull Crusher', 'Front Squat', 'Incline Bench Press', 'Hip Thrust', 'Shrug'];
export const isBarbell = (n) => BARBELL.includes(n) || /barbell|bench press|squat|deadlift/i.test(n) && !/dumbbell|machine|smith/i.test(n);

export const BODYWEIGHT_HINT = (n) => /push-up|squat \(baithak\)|dand|plank|hold|balance|bird dog|dead bug|glute bridge|surya|sit-to-stand|bodyweight|chair dips|pull-up|chin-up|\(sec\)|\(m\)|\(rounds\)/i.test(n);
export const EXERCISE_LIBRARY = [...new Set([...Object.values(SPLITS).flat(), 'Front Squat', 'Incline Bench Press', 'Hip Thrust',
  'Shrug', 'Dips', 'Chin-up', 'Face Pull', 'Cable Fly', 'Leg Extension', 'Dumbbell Shoulder Press', 'Preacher Curl'])].sort();
