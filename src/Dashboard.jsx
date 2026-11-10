import { useState } from 'preact/hooks';
import { get, put, rows, useStore } from './store.js';
import { dayBalance, proteinFloor, goalOf, today, prettyDay, fmt, int, weightSeries, stallCheck } from './calc.js';
import { Bar, Icon } from './ui.jsx';
import { CheckInCard, ActivityCard, ForYou } from './Today.jsx';
import { MotivationCard, MusicCard } from './Motivation.jsx';
import { WeeklyDose, EvidenceCard } from './Science.jsx';
import { streak } from './science.js';

export function DeficitMeter({ p, day }) {
  const b = dayBalance(day, p);
  const g = goalOf(p);
  const eaten = b.intake.kcal;
  const over = eaten > b.target;
  const surplusGoal = g.offset > 0;
  // For cuts we want deficit ≥ goal; for bulks we want surplus ≥ goal; for diagnostic, just show balance.
  const net = b.deficit; // positive = deficit
  const hit = g.offset < 0 ? net >= b.goalDeficit : g.offset > 0 ? -net >= g.offset : false;
  const tone = over && g.offset <= 0 ? 'rose' : hit ? 'em' : 'neutral';
  const label = net >= 0 ? 'Deficit' : 'Surplus';
  return (
    <section class={'card meter ' + tone}>
      <div class="meter-top">
        <div>
          <small class="eyebrow">{label} so far · {prettyDay(day)}</small>
          <div class="big num">{fmt(Math.abs(net))}<span> kcal</span></div>
        </div>
        <div class="meter-goal">
          <small>{g.dir === 0 ? 'Mode' : surplusGoal ? 'Surplus goal' : 'Deficit goal'}</small>
          <b>{g.dir === 0 ? 'Diagnostic' : fmt(Math.abs(g.offset))}</b>
        </div>
      </div>
      {g.offset !== 0 && <Bar value={surplusGoal ? Math.max(0, -net) : Math.max(0, net)} max={Math.abs(g.offset) * 1.5} mark={Math.abs(g.offset)} tone={tone} />}
      <div class="eq">
        <span>BMR <b>{fmt(b.burn.bmr)}</b></span>+
        <span>Training <b>{fmt(b.burn.workout)}</b></span>+
        <span>Steps <b>{fmt(b.burn.stepsKcal)}</b></span>+
        <span>Activity <b>{fmt(b.burn.activity)}</b></span>−
        <span>Eaten <b>{fmt(eaten)}</b></span>
      </div>
    </section>
  );
}

export function Dashboard({ p, go, openSettings, askCoach, openMotivation }) {
  useStore();
  const day = today();
  const b = dayBalance(day, p);
  const pf = proteinFloor(p);
  const log = get('day_logs', day);
  const [steps, setSteps] = useState(log?.steps ?? '');
  const [wk, setWk] = useState(log?.workout_kcal ?? '');
  const series = weightSeries();
  const last = series[series.length - 1];
  const stall = stallCheck(p);
  const active = rows('workouts').find((w) => w.day === day && !w.finished);
  const doneSets = rows('workout_sets').filter((s) => s.day === day && s.done).length;
  const left = b.target - b.intake.kcal;
  const st = streak();

  const saveLog = (patch) => put('day_logs', { id: day, day, steps: log?.steps ?? null, workout_kcal: log?.workout_kcal ?? null, ...patch });

  return (
    <div class="page">
      <header class="top">
        <div><h1 class="h1">{greeting()}</h1><small class="muted">{goalOf(p).label}{p.city ? ` · ${p.city}` : ''}</small></div>
        <div class="row">
          {st > 0 && <span class="streak" title="Days in a row with something logged"><Icon name="flame" size={15} /> {st}</span>}
          <button class="icon-btn" onClick={openSettings} aria-label="Settings"><Icon name="gear" /></button>
        </div>
      </header>

      <MotivationCard p={p} onEdit={openMotivation} />

      {stall?.stalled && (
        <button class="alert" onClick={() => go('progress')}>
          <Icon name="alert" /> <span>Stall: no new {goalOf(p).dir < 0 ? 'low' : 'high'} in your 7-day average for {stall.since} days. Tap for the fix.</span>
        </button>
      )}

      <CheckInCard p={p} askCoach={askCoach} />

      <DeficitMeter p={p} day={day} />

      <div class="grid2">
        <section class={'card stat ' + (left < 0 ? 'rose' : '')} onClick={() => go('fuel')}>
          <small class="eyebrow">Calories</small>
          <div class="mid num">{fmt(b.intake.kcal)}<span> / {fmt(b.target)}</span></div>
          <Bar value={b.intake.kcal} max={b.target} tone={left < 0 ? 'rose' : 'em'} />
          <small class={left < 0 ? 'rose-t' : 'muted'}>{left < 0 ? `${fmt(-left)} over` : `${fmt(left)} left`}</small>
        </section>
        <section class={'card stat ' + (b.intake.protein >= pf ? 'em' : '')} onClick={() => go('fuel')}>
          <small class="eyebrow">Protein floor</small>
          <div class="mid num">{b.intake.protein}<span> / {pf} g</span></div>
          <Bar value={b.intake.protein} max={pf} tone="em" />
          <small class={b.intake.protein >= pf ? 'em-t' : 'muted'}>{b.intake.protein >= pf ? 'Floor hit' : `${pf - b.intake.protein} g to go`}</small>
        </section>
      </div>

      <ActivityCard p={p} />

      <section class="card">
        <small class="eyebrow">Steps & gym</small>
        <div class="grid2">
          <label class="field"><span class="field-label">Steps</span>
            <input inputMode="numeric" placeholder="0" value={steps}
              onInput={(e) => setSteps(e.currentTarget.value)} onChange={(e) => saveLog({ steps: int(e.currentTarget.value) })} />
            <span class="field-hint">≈ {fmt(b.burn.stepsKcal)} kcal</span>
          </label>
          <label class="field"><span class="field-label">Training kcal</span>
            <input inputMode="numeric" placeholder={`${b.burn.autoWorkout} (auto)`} value={wk}
              onInput={(e) => setWk(e.currentTarget.value)} onChange={(e) => saveLog({ workout_kcal: int(e.currentTarget.value) })} />
            <span class="field-hint">Auto from {doneSets} logged sets. Leave blank to use it.</span>
          </label>
        </div>
      </section>

      <div class="grid2">
        <section class="card stat" onClick={() => go('iron')}>
          <small class="eyebrow">Iron</small>
          <div class="mid">{active ? active.split : doneSets ? 'Done' : 'Rest day?'}</div>
          <small class="muted">{active ? `${doneSets} sets in. Tap to continue` : doneSets ? `${doneSets} sets logged` : 'Tap to start a session'}</small>
        </section>
        <section class="card stat" onClick={() => go('progress')}>
          <small class="eyebrow">7-day avg weight</small>
          <div class="mid num">{last ? fmt(last.ma, 1) : '–'}<span> kg</span></div>
          <small class="muted">{last?.day === day ? `Today ${fmt(last.kg, 1)} kg` : 'Log your morning weigh-in'}</small>
        </section>
      </div>
      <WeeklyDose p={p} go={go} />
      <ForYou p={p} go={go} askCoach={askCoach} />
      <MusicCard p={p} onEdit={openMotivation} />
      <EvidenceCard />
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
