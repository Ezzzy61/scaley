// Location data: states → food region, city commute presets, and seasonal climate notes.
// Commute presets are activity ids from activities.js with a default duration.

export const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Outside India'];

const REGION_OF = {
  Maharashtra: 'MH', Goa: 'MH',
  Delhi: 'N', Punjab: 'N', Haryana: 'N', Chandigarh: 'N', 'Uttar Pradesh': 'N', Uttarakhand: 'N', 'Himachal Pradesh': 'N', 'Jammu & Kashmir': 'N', Ladakh: 'N',
  Karnataka: 'S', 'Tamil Nadu': 'S', Kerala: 'S', 'Andhra Pradesh': 'S', Telangana: 'S', Puducherry: 'S',
  'West Bengal': 'E', Bihar: 'E', Odisha: 'E', Jharkhand: 'E', Assam: 'E', 'Arunachal Pradesh': 'E', Manipur: 'E', Meghalaya: 'E', Mizoram: 'E', Nagaland: 'E', Sikkim: 'E', Tripura: 'E',
  Gujarat: 'W', Rajasthan: 'W', 'Madhya Pradesh': 'W', Chhattisgarh: 'W',
};
export const regionOf = (state) => REGION_OF[state] || 'ALL';

// Commute presets per metro. Unknown cities get the generic list.
const GENERIC = [['bus_standing', 30], ['commute_walk', 15], ['two_wheeler', 30], ['seated_travel', 30]];
export const CITIES = {
  Mumbai: { state: 'Maharashtra', presets: [['local_standing', 40], ['local_seated', 40], ['commute_walk', 15], ['stairs_fob', 5], ['metro_standing', 25], ['bus_standing', 30]],
    climate: { 6: 'Monsoon is here. Keep cardio indoors on heavy-rain days: stair climbs at home, skipping, Surya Namaskar.', 7: 'Peak monsoon: waterlogged roads, so swap outdoor walks for indoor circuits and mall or society-corridor walks.', 8: 'Monsoon humidity drains you fast. Add a pinch of salt and lemon to your water on training days.', 9: 'Late monsoon, then October heat. Train early morning or after 7 pm.', 4: 'Hot and humid. Hydrate before you get on the local, and carry ORS on long days.', 5: 'Pre-monsoon humidity. Lower your cardio pace and trust the talk test, not your watch.' } },
  Pune: { state: 'Maharashtra', presets: [['two_wheeler', 30], ['bus_standing', 30], ['commute_walk', 15], ['metro_standing', 20]],
    climate: { 6: 'Monsoon weekends are made for Sinhagad and Rajmachi treks. Log them as hiking.', 7: 'Rainy season: good for long zone-2 walks in the drizzle, so wear grip shoes.' } },
  Delhi: { state: 'Delhi', presets: [['metro_standing', 35], ['commute_walk', 15], ['stairs_fob', 4], ['bus_standing', 30], ['seated_travel', 40]],
    climate: { 11: 'Smog season. Check the AQI before outdoor cardio. Above 200, train indoors and skip the morning run.', 12: 'Cold and smoggy mornings. Do your cardio indoors or at midday, and warm up longer for heavy lifts.', 1: 'Peak winter. Joints feel stiff, so take 10 minutes of warm-up before your first heavy set.', 5: '45°C heat. Do outdoor cardio before 7 am only, and add electrolytes.', 6: 'Brutal heat and humidity. Indoor cardio, nimbu-pani with salt, no midday walks.', 10: 'Pleasant before the smog starts. Best month for outdoor walks at Lodhi Garden or your local park.' } },
  Gurugram: { state: 'Haryana', presets: [['metro_standing', 30], ['seated_travel', 45], ['commute_walk', 10]], climate: { 11: 'AQI spikes. Use the office gym or home workouts on bad-air days.' } },
  Noida: { state: 'Uttar Pradesh', presets: [['metro_standing', 30], ['seated_travel', 40], ['commute_walk', 10]], climate: { 11: 'AQI spikes. Use the office gym or home workouts on bad-air days.' } },
  Bengaluru: { state: 'Karnataka', presets: [['seated_travel', 60], ['metro_standing', 30], ['bus_standing', 40], ['commute_walk', 15], ['two_wheeler', 45]],
    climate: { 0: 'Mild weather all year. Outdoor zone-2 walks or Cubbon Park loops are nearly always possible, so traffic time is your real enemy.' } },
  Chennai: { state: 'Tamil Nadu', presets: [['local_standing', 35], ['metro_standing', 25], ['bus_standing', 35], ['commute_walk', 15]],
    climate: { 4: 'Hot and humid. Do beach-road walks at sunrise only.', 5: 'Agni nakshatram heat. Cardio indoors, plenty of buttermilk and tender coconut.', 10: 'North-east monsoon. Plan indoor sessions on cyclone-alert days.', 11: 'Monsoon. Indoor circuits on heavy-rain days.' } },
  Hyderabad: { state: 'Telangana', presets: [['metro_standing', 30], ['two_wheeler', 35], ['bus_standing', 35], ['commute_walk', 15]],
    climate: { 4: 'Dry heat. Train early and get electrolytes in.', 5: 'Peak summer. Avoid 11 am–4 pm outdoors.', 9: 'Ramzan/festive months mean late dinners. Keep protein steady even when meal times shift.' } },
  Kolkata: { state: 'West Bengal', presets: [['local_standing', 40], ['metro_standing', 30], ['bus_standing', 35], ['commute_walk', 15]],
    climate: { 6: 'Monsoon humidity. Keep cardio short and steady, and hydrate.', 9: 'Pujo season: lots of walking pandal to pandal. Log it as an easy walk, it counts.', 10: 'Pujo season: lots of walking pandal to pandal. Log it as an easy walk, it counts.' } },
  Ahmedabad: { state: 'Gujarat', presets: [['two_wheeler', 30], ['bus_standing', 30], ['commute_walk', 15]],
    climate: { 4: '42°C+. Do Riverfront walks before 7 am only.', 9: 'Navratri: garba nights are serious cardio. Log them as dance.', 10: 'Navratri: garba nights are serious cardio. Log them as dance.' } },
  Jaipur: { state: 'Rajasthan', presets: [['two_wheeler', 25], ['bus_standing', 30], ['commute_walk', 15], ['metro_standing', 20]], climate: { 5: 'Extreme heat. Indoor cardio and extra water and salt.' } },
  Lucknow: { state: 'Uttar Pradesh', presets: [['two_wheeler', 25], ['metro_standing', 20], ['commute_walk', 15]], climate: { 12: 'Foggy winter mornings. Shift walks to the evening.' } },
  Kochi: { state: 'Kerala', presets: [['metro_standing', 20], ['bus_standing', 30], ['commute_walk', 15]], climate: { 6: 'Heavy monsoon. Indoor training, and dry your shoes well.' } },
  Chandigarh: { state: 'Chandigarh', presets: [['two_wheeler', 20], ['commute_walk', 15], ['cycling_easy', 20]], climate: { 0: 'Wide sector roads and Sukhna Lake are perfect for zone-2 walks and cycling.' } },
};
export const cityNames = () => Object.keys(CITIES);
export const presetsFor = (city) => (CITIES[city]?.presets || GENERIC);

export function climateTip(city, month = new Date().getMonth() + 1) {
  const c = CITIES[city]?.climate;
  if (!c) return null;
  return c[month] || c[0] || null;
}

// Intercity travel presets apply everywhere.
export const TRAVEL_PRESETS = [['intercity_train', 360], ['long_drive', 240], ['flight_day', 180]];
