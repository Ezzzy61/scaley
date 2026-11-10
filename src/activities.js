// Non-gym activity with MET values (Compendium of Physical Activities ballparks).
// Burn added on top of BMR uses NET METs: (MET - 1) × kg × hours, so resting energy isn't counted twice.

export const ACTIVITIES = [
  // Commute & daily life
  { id: 'local_standing', label: 'Local train, standing', met: 2.0, group: 'Commute' },
  { id: 'local_seated', label: 'Local train, seated', met: 1.3, group: 'Commute' },
  { id: 'metro_standing', label: 'Metro, standing', met: 2.0, group: 'Commute' },
  { id: 'bus_standing', label: 'Bus, standing', met: 2.0, group: 'Commute' },
  { id: 'commute_walk', label: 'Walk to station/office', met: 3.5, group: 'Commute' },
  { id: 'stairs_fob', label: 'Station stairs / foot-over-bridge', met: 8.0, group: 'Commute' },
  { id: 'two_wheeler', label: 'Bike / scooter ride', met: 1.8, group: 'Commute' },
  { id: 'seated_travel', label: 'Car / cab / auto (seated)', met: 1.3, group: 'Commute' },
  { id: 'intercity_train', label: 'Intercity train journey', met: 1.3, group: 'Travel day' },
  { id: 'long_drive', label: 'Long drive', met: 1.5, group: 'Travel day' },
  { id: 'flight_day', label: 'Flight + airport walking', met: 1.8, group: 'Travel day' },
  { id: 'household', label: 'Housework / chores', met: 3.0, group: 'Daily life' },
  { id: 'shopping_walk', label: 'Market / mall walking', met: 2.8, group: 'Daily life' },
  // Cardio
  { id: 'walk_easy', label: 'Easy walk', met: 3.0, group: 'Cardio' },
  { id: 'zone2_walk', label: 'Zone-2 brisk walk (can still talk)', met: 4.3, group: 'Cardio', easy: true },
  { id: 'jog', label: 'Jog / run', met: 8.0, group: 'Cardio' },
  { id: 'cycling_easy', label: 'Cycling, easy', met: 4.0, group: 'Cardio', easy: true },
  { id: 'cycling_mod', label: 'Cycling, moderate', met: 6.8, group: 'Cardio' },
  { id: 'swim', label: 'Swimming', met: 6.0, group: 'Cardio' },
  { id: 'skipping', label: 'Skipping rope', met: 10.0, group: 'Cardio' },
  { id: 'hiking', label: 'Trek / hike', met: 6.0, group: 'Cardio' },
  { id: 'stair_climb', label: 'Stair climbing (building)', met: 8.0, group: 'Cardio' },
  // Mind-body & sport
  { id: 'yoga', label: 'Yoga (hatha / flow)', met: 2.8, group: 'Yoga & sport', easy: true },
  { id: 'surya', label: 'Surya Namaskar', met: 4.0, group: 'Yoga & sport' },
  { id: 'pranayama', label: 'Pranayama / breathing', met: 1.3, group: 'Yoga & sport', easy: true },
  { id: 'cricket', label: 'Cricket', met: 5.0, group: 'Yoga & sport' },
  { id: 'badminton', label: 'Badminton', met: 5.5, group: 'Yoga & sport' },
  { id: 'football', label: 'Football', met: 7.0, group: 'Yoga & sport' },
  { id: 'dance', label: 'Dance / Zumba / Garba', met: 6.0, group: 'Yoga & sport' },
  { id: 'kabaddi', label: 'Kabaddi / wrestling', met: 6.0, group: 'Yoga & sport' },
  { id: 'custom', label: 'Something else', met: 4.0, group: 'Other' },
];
export const activityById = (id) => ACTIVITIES.find((a) => a.id === id) || ACTIVITIES[ACTIVITIES.length - 1];
export const INTENSITY_MET = { easy: 3.0, moderate: 5.0, hard: 7.5 };

export const activityKcal = (met, minutes, kg) => Math.max(0, Math.round((met - 1) * (kg || 70) * (minutes / 60)));
export const zone2HR = (age) => (age ? `${Math.round(180 - age - 10)}–${Math.round(180 - age)} bpm` : 'a pace where you can still talk in full sentences');
