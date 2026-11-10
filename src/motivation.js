// Motivation archetypes, original daily lines (written for Scaley, not quoted from anyone),
// music link parsing and vibe searches.

export const ARCHETYPES = [
  { key: 'self', label: 'Future me', emoji: '🌱', color: '#10b981', skin: 'clean', hint: 'The person you are becoming' },
  { key: 'boxer', label: 'Boxer / fighter', emoji: '🥊', color: '#ef4444', skin: 'fight', hint: 'Ring discipline, early runs' },
  { key: 'pehlwan', label: 'Pehlwan / akhada', emoji: '🤼', color: '#ea580c', skin: 'fight', hint: 'Mitti, dand-baithak, desi ghee' },
  { key: 'warrior', label: 'Mythic warrior', emoji: '🏹', color: '#d97706', skin: 'epic', hint: 'Arjun, Bhima, Hanuman-level focus' },
  { key: 'superhero', label: 'Superhero', emoji: '🦸', color: '#3b82f6', skin: 'fight', hint: 'Your favourite cape or shield' },
  { key: 'anime', label: 'Anime arc', emoji: '⚡', color: '#d946ef', skin: 'fight', hint: 'Training arc, power-up energy' },
  { key: 'athlete', label: 'Athlete', emoji: '🏏', color: '#0ea5e9', skin: 'clean', hint: 'Cricket, football, Olympics' },
  { key: 'fauji', label: 'Fauji / soldier', emoji: '🎖️', color: '#65a30d', skin: 'epic', hint: 'Discipline, PT at 5 am' },
  { key: 'spiritual', label: 'Faith / spiritual', emoji: '🕉️', color: '#f59e0b', skin: 'calm', hint: 'Body as a temple, seva, prayer' },
  { key: 'family', label: 'Family', emoji: '👨‍👩‍👧', color: '#ec4899', skin: 'calm', hint: 'For your kids, parents, partner' },
];
export const archOf = (k) => ARCHETYPES.find((a) => a.key === k) || ARCHETYPES[0];

// Original lines. {hero} is replaced with the user's hero when they set one.
const LINES = {
  self: [
    'You are not starting over. You are starting from experience.',
    'Small, boring, daily. That is the whole secret.',
    'Future you is watching today\'s choices. Give them a good show.',
    'Consistency beats intensity when intensity quits in week two.',
    'One good meal, one good walk, one good set. Stack them.',
    'You don\'t need motivation for things you\'ve made a habit.',
    'Progress hides in the weekly average, not today\'s scale.',
    'Do it tired. Do it short. Just don\'t skip it twice.',
  ],
  boxer: [
    'The fight is won in the miles nobody sees.',
    'Hands up, chin down, show up again tomorrow.',
    'Every round you finish makes the next one shorter.',
    'Tired is a feeling. Quitting is a decision.',
    'Train like the bell already rang.',
    'Your jab gets sharper every boring morning.',
    'Sweat now, shine under the lights later.',
    '{hero} didn\'t skip roadwork because it was raining.',
  ],
  pehlwan: [
    'Mitti mein mehnat, mann mein shanti.',
    'Dand-baithak se pehle bahana nahi, sirf shuruaat.',
    'Akhada sikhata hai: roz thoda, kabhi kam nahi.',
    'Strong legs, strong roots, strong family.',
    'Doodh, dal, daud, dand. The old formula still works.',
    'Gurus didn\'t count reps. They counted years.',
    'Ek aur set. Phir ek aur din.',
    'Ghar ka khana, ghar ka akhada, ghar ka pehlwan.',
  ],
  warrior: [
    'See only the bird\'s eye: today\'s session.',
    'Duty first, mood later.',
    'The bow is strung slowly, then it holds for years.',
    'Carry the mountain one step at a time.',
    'Your sankalp is stronger than one bad day.',
    'Strength without discipline is just noise.',
    'Practise until it becomes your nature.',
    'Like {hero}: steady aim, steady effort.',
  ],
  superhero: [
    'Every hero has a training montage. This is yours.',
    'Powers are earned in the boring scenes.',
    'Origin story: today. Sequel: in 12 weeks.',
    'The suit fits better when you\'ve done the work.',
    'Save the day by saving your streak.',
    'Strong enough to lift others, start with yourself.',
    '{hero} trains even when the city sleeps.',
    'Real powers: sleep, protein, showing up.',
  ],
  anime: [
    'Training arc in progress. Filler episodes not allowed.',
    'Break your limits one rep at a time.',
    'Your power level grows while you rest. Sleep is a technique.',
    'The final form is just the result of a thousand normal days.',
    'Today\'s rep is tomorrow\'s plot twist.',
    'Every grind episode pays off in the finale.',
    '{hero} wasn\'t born strong. They just never stopped.',
    'Level up quietly. Let the results do the shouting.',
  ],
  athlete: [
    'Champions are built in the off-season.',
    'Play the long innings. Singles win matches.',
    'Fitness is your first selection trial.',
    'Recovery is part of the training plan, not a break from it.',
    'Show up like it\'s match day.',
    'Talent warms up, discipline plays the full game.',
    'Like {hero}: basics, repeated until they\'re brilliant.',
    'Run the extra lap nobody asked for.',
  ],
  fauji: [
    'Discipline is doing it right when nobody inspects.',
    'Boots on, excuses off.',
    'PT is not a punishment. It\'s preparation.',
    'Fall in. Finish strong. Fall out proud.',
    'Small orders, followed daily, win big battles.',
    'The body follows the mind\'s command. Give a clear one.',
    'Hydrate, eat, sleep, train. Repeat.',
    'Ready for anything starts with ready for today.',
  ],
  spiritual: [
    'Seva starts with a body that can serve.',
    'Treat the body like a temple: clean, strong, cared for.',
    'Discipline is devotion in action.',
    'Breathe in strength, breathe out doubt.',
    'Do the work, release the result.',
    'A calm mind lifts heavier.',
    'Gratitude for every rep this body still gives.',
    'Each meal can be prasad: offered with intent, eaten with care.',
  ],
  family: [
    'Be the parent who can still race them to the gate.',
    'Your health is a gift to everyone who loves you.',
    'Strong today so you can carry them tomorrow.',
    'Healthy habits are the best inheritance.',
    'They watch what you do, not what you say. Show them.',
    'Every walk is more years with your people.',
    'Energy for work, energy for home. Train for both.',
    'Do it for {hero}. Then do it for you.',
  ],
};

function dayIndex(d = new Date()) { return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); }

export function linesFor(m) {
  const a = m?.arch || 'self';
  const hero = (m?.hero || '').trim();
  const base = (LINES[a] || LINES.self).map((l) => (l.includes('{hero}') ? (hero ? l.replaceAll('{hero}', hero) : null) : l)).filter(Boolean);
  const own = (m?.mantras || []).filter(Boolean);
  return [...own, ...base];
}
export function quoteOfDay(m, offset = 0) {
  const all = linesFor(m);
  return all[(dayIndex() + offset) % all.length];
}

// ---------- music ----------
export function parseMusic(url) {
  let u;
  try { u = new URL(String(url).trim()); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const h = u.hostname.replace(/^www\.|^m\./, '');
  if (h === 'soundcloud.com' || h === 'on.soundcloud.com' || h === 'api.soundcloud.com') {
    return { kind: 'soundcloud', label: 'SoundCloud', embed: `https://w.soundcloud.com/player/?url=${encodeURIComponent(u.href)}&auto_play=false&visual=false&show_comments=false&hide_related=true`, height: 166 };
  }
  if (h === 'open.spotify.com') {
    const m = u.pathname.match(/\/(track|playlist|album|artist|episode|show)\/([A-Za-z0-9]+)/);
    if (m) return { kind: 'spotify', label: 'Spotify', embed: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: m[1] === 'track' ? 152 : 352 };
  }
  if (h === 'youtube.com' || h === 'youtu.be' || h === 'music.youtube.com') {
    const list = u.searchParams.get('list');
    const id = h === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') || (u.pathname.match(/\/(shorts|embed|live)\/([\w-]+)/) || [])[2];
    if (id && /^[\w-]{6,20}$/.test(id)) return { kind: 'youtube', label: 'YouTube', embed: `https://www.youtube-nocookie.com/embed/${id}${list ? `?list=${encodeURIComponent(list)}` : ''}`, height: 200 };
    if (list) return { kind: 'youtube', label: 'YouTube', embed: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`, height: 200 };
  }
  if (h === 'music.apple.com') return { kind: 'apple', label: 'Apple Music', embed: `https://embed.music.apple.com${u.pathname}${u.search}`, height: 175 };
  const known = { 'jiosaavn.com': 'JioSaavn', 'gaana.com': 'Gaana', 'wynk.in': 'Wynk', 'bandcamp.com': 'Bandcamp', 'mixcloud.com': 'Mixcloud', 'audiomack.com': 'Audiomack', 'discord.com': 'Discord', 'discord.gg': 'Discord', 'bitchute.com': 'BitChute' };
  const k = Object.keys(known).find((d) => h === d || h.endsWith('.' + d));
  return { kind: 'link', label: k ? known[k] : h, embed: null };
}

export const VIBES = [
  { key: 'phonk', label: 'Phonk', q: 'gym phonk' },
  { key: 'dubstep', label: 'Dubstep', q: 'dubstep workout mix' },
  { key: 'desihiphop', label: 'Desi hip-hop', q: 'desi hip hop workout' },
  { key: 'bolly', label: 'Bollywood gym', q: 'bollywood gym workout songs' },
  { key: 'punjabi', label: 'Punjabi', q: 'punjabi workout songs' },
  { key: 'boxing', label: 'Fight / boxing', q: 'boxing training music' },
  { key: 'anime', label: 'Anime OST', q: 'anime workout ost' },
  { key: 'devotional', label: 'Devotional', q: 'hanuman chalisa powerful' },
  { key: 'sufi', label: 'Sufi / qawwali', q: 'sufi qawwali energetic' },
  { key: 'lofi', label: 'Lo-fi cardio', q: 'lofi walking playlist' },
  { key: 'rock', label: 'Rock / metal', q: 'rock metal gym playlist' },
  { key: 'edm', label: 'EDM', q: 'edm workout mix' },
];
export const vibeLinks = (q) => [
  { label: 'SoundCloud', url: `https://soundcloud.com/search?q=${encodeURIComponent(q)}` },
  { label: 'YouTube', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
  { label: 'Spotify', url: `https://open.spotify.com/search/${encodeURIComponent(q)}` },
];
