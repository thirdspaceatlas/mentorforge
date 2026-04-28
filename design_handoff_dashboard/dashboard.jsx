// MentorForge Dashboard — aligned to the live brand palette
// Ink + Paper + Amber (matching landing/tokens.jsx and the signup flow)

const MF = {
  ink:        '#0E1A2B',
  ink2:       '#3A4860',
  slate:      '#7A8699',
  hair:       '#E6E4DE',
  hair2:      '#D6D2C7',
  paper:      '#F5F2EC',
  paper2:     '#EFEBE2',
  card:       '#FFFFFF',
  amber:      '#C9842B',
  amberSoft:  '#F4E8D2',
  amberDeep:  '#A86B1F',
  green:      '#5A7D5A',
  rust:       '#A85A3A',
};

const F_SERIF = '"Instrument Serif", "Iowan Old Style", Georgia, serif';
const F_SERIF2 = '"Source Serif 4", Georgia, serif';
const F_SANS  = '"Inter", -apple-system, "SF Pro Text", system-ui, sans-serif';
const F_MONO  = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace';

// ─── Sidebar ─────────────────────────────────────────────────

function Sidebar() {
  const items = [
    { id: 'plan',  label: 'Study Plan',     active: true  },
    { id: 'cal',   label: 'Calendar Coach', active: false },
    { id: 'acct',  label: 'Account',        active: false },
  ];
  const Icon = ({ kind, on }) => {
    const c = on ? MF.ink : MF.ink2;
    if (kind === 'plan') return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke={c} strokeWidth="1.3"/><path d="M2 6h12M5 2v3M11 2v3" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>;
    if (kind === 'cal')  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1.3"/><path d="M8 4v4l2.5 2" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>;
    return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.5" stroke={c} strokeWidth="1.3"/><path d="M3 14c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>;
  };
  return (
    <aside style={{
      width: 220, padding: '20px 14px',
      borderRight: `1px solid ${MF.hair}`,
      background: MF.paper,
      display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0,
    }}>
      <div style={{ padding: '6px 8px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: MF.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: F_SERIF, fontSize: 18, color: MF.paper, fontWeight: 500,
        }}>M</div>
        <span style={{ fontFamily: F_SERIF, fontSize: 22, color: MF.ink, letterSpacing: -0.3 }}>MentorForge</span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => (
          <div key={it.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8,
            background: it.active ? MF.paper2 : 'transparent',
            fontFamily: F_SANS, fontSize: 13.5, fontWeight: it.active ? 600 : 500,
            color: it.active ? MF.ink : MF.ink2,
            position: 'relative',
          }}>
            {it.active && <div style={{ position: 'absolute', left: -14, top: 8, bottom: 8, width: 2, background: MF.amber, borderRadius: 2 }} />}
            <Icon kind={it.id === 'plan' ? 'plan' : it.id === 'cal' ? 'cal' : 'acct'} on={it.active} />
            <span>{it.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      <div style={{
        padding: 12, borderRadius: 10, background: MF.card,
        border: `1px solid ${MF.hair}`,
      }}>
        <div style={{ fontFamily: F_SANS, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MF.slate }}>Sitting</div>
        <div style={{ fontFamily: F_SERIF, fontSize: 22, color: MF.ink, marginTop: 2, letterSpacing: -0.2 }}>Feb 2026</div>
        <div style={{ fontFamily: F_SANS, fontSize: 11.5, color: MF.ink2, marginTop: 2 }}>18 weeks remaining</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: MF.ink, color: MF.paper, fontFamily: F_SERIF, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>JL</div>
        <div style={{ fontFamily: F_SANS, fontSize: 12.5, color: MF.ink, fontWeight: 500 }}>Jordan Lee</div>
      </div>
    </aside>
  );
}

// ─── Hero ────────────────────────────────────────────────────

function StudySessionHero() {
  return (
    <section style={{
      padding: '32px 36px', borderRadius: 16,
      background: MF.card,
      border: `1px solid ${MF.hair}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, padding: '14px 18px', fontFamily: F_MONO, fontSize: 10, color: MF.slate, letterSpacing: 1 }}>
        TUE · 12 MAY 2026
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: F_SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.6,
            textTransform: 'uppercase', color: MF.amber,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 16, height: 1, background: MF.amber }} />
            Next study session
          </div>
          <h1 style={{
            fontFamily: F_SERIF, fontSize: 48, lineHeight: 1.05, fontWeight: 400,
            color: MF.ink, margin: '10px 0 0', letterSpacing: -0.6,
          }}>
            Equity Investments<span style={{ color: MF.slate }}>.</span>
          </h1>
          <div style={{ fontFamily: F_SANS, fontSize: 13.5, color: MF.ink2, marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={MF.ink2} strokeWidth="1.3"/><path d="M8 4v4l2.5 2" stroke={MF.ink2} strokeWidth="1.3" strokeLinecap="round"/></svg>
              45 min · starts 4:45 PM
            </span>
            <span style={{ width: 3, height: 3, borderRadius: 1.5, background: MF.slate }} />
            <span>Reading 23 · DCF practice set</span>
          </div>
        </div>

        <button style={{
          height: 52, padding: '0 24px 0 26px', borderRadius: 999, border: 'none',
          background: MF.ink, color: MF.paper,
          fontFamily: F_SANS, fontSize: 15, fontWeight: 600, letterSpacing: -0.1,
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(14,26,43,0.18)',
        }}>
          Begin session
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke={MF.paper} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <div style={{ marginTop: 28, paddingTop: 22, borderTop: `1px solid ${MF.hair}` }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: F_SANS, fontSize: 11, marginBottom: 10,
        }}>
          <span style={{ color: MF.slate, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
            Today's allocation
          </span>
          <span style={{ fontFamily: F_SERIF, fontSize: 17, color: MF.ink }}>
            <span style={{ fontWeight: 500 }}>1h 30m</span> <span style={{ color: MF.slate, fontFamily: F_MONO, fontSize: 12 }}>/ 2h 15m</span>
          </span>
        </div>
        <div style={{ position: 'relative', height: 8, borderRadius: 2, background: MF.paper2, overflow: 'visible' }}>
          <div style={{ position: 'absolute', inset: 0, width: '67%', borderRadius: 2, background: MF.ink }} />
          <div style={{ position: 'absolute', top: -3, left: '67%', width: 14, height: 14, borderRadius: 7, background: MF.amber, border: `2px solid ${MF.card}`, transform: 'translateX(-7px)', boxShadow: '0 2px 6px rgba(201,132,43,0.4)' }} />
        </div>
        <div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 16,
          fontFamily: F_SANS, fontSize: 11.5, color: MF.ink2,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: MF.ink }} /> 3 sessions logged
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: MF.amber }} /> Up next · 4:45 PM
          </span>
          <span style={{ marginLeft: 'auto', color: MF.slate, fontFamily: F_MONO, fontSize: 11 }}>
            ◇  Calendar synced · 2 sessions today
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── Day Ribbon ──────────────────────────────────────────────

function DayRibbon() {
  const sessions = [
    { start: 7.0,  end: 7.75,  topic: 'Probability Distributions',     state: 'done' },
    { start: 9.5,  end: 10.0,  topic: 'Standard III · Duties',         state: 'done' },
    { start: 12.5, end: 13.25, topic: 'Pensions & PP/E',               state: 'done' },
    { start: 16.75,end: 17.5,  topic: 'Reading 23 · DCF practice',     state: 'next' },
    { start: 21.0, end: 21.5,  topic: '25 flashcards',                 state: 'queued' },
  ];
  const dayStart = 6, dayEnd = 23, span = dayEnd - dayStart;
  const xfor = (h) => ((h - dayStart) / span) * 100;
  const nowH = 16.2;
  const labelFor = (s) => {
    const h = Math.floor(s.start), m = Math.round((s.start - h) * 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  return (
    <div style={{
      padding: '26px 32px 30px', borderRadius: 16, background: MF.card,
      border: `1px solid ${MF.hair}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{
            fontFamily: F_SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.4,
            textTransform: 'uppercase', color: MF.amber,
          }}>Today's docket</div>
          <h2 style={{ fontFamily: F_SERIF, fontSize: 26, color: MF.ink, margin: '8px 0 4px', letterSpacing: -0.4, fontWeight: 400 }}>
            Five sessions. Three done.
          </h2>
          <div style={{ fontFamily: F_SANS, fontSize: 12.5, color: MF.ink2 }}>
            <span style={{ color: MF.ink, fontWeight: 600 }}>2h 15m</span> remaining · next at 4:45 PM
          </div>
        </div>
        <button style={{
          height: 32, padding: '0 14px', borderRadius: 999,
          background: 'transparent', border: `1px solid ${MF.hair2}`,
          fontFamily: F_SANS, fontSize: 12, color: MF.ink, fontWeight: 500,
          cursor: 'pointer',
        }}>+ Add session</button>
      </div>

      <div style={{ position: 'relative', height: 110, marginTop: 26 }}>
        <div style={{ position: 'absolute', top: 50, left: 0, right: 0, height: 24 }}>
          {[6, 9, 12, 15, 18, 21].map(h => (
            <div key={h} style={{
              position: 'absolute', left: `${xfor(h)}%`, top: 0, height: 6,
              borderLeft: `1px solid ${MF.hair2}`,
            }}>
              <span style={{
                position: 'absolute', top: 10, left: -14, width: 32,
                fontFamily: F_MONO, fontSize: 10, color: MF.slate, letterSpacing: 0.3,
              }}>{String(h).padStart(2,'0')}:00</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', top: 50, left: 0, right: 0, height: 1, background: MF.hair2 }} />
        <div style={{ position: 'absolute', top: 49, left: 0, height: 3, width: `${xfor(nowH)}%`, background: MF.ink, borderRadius: 1 }} />

        {sessions.map((s, i) => {
          const left = xfor(s.start);
          const width = xfor(s.end) - left;
          const isDone = s.state === 'done';
          const isNext = s.state === 'next';
          const above = isNext || i % 2 === 0;
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${left}%`,
              width: `max(${width}%, 86px)`,
              top: above ? 4 : 64,
              height: 42,
              borderRadius: 8,
              background: isDone ? MF.ink : (isNext ? MF.amber : 'transparent'),
              border: isDone ? 'none' : (isNext ? `1px solid ${MF.amber}` : `1.5px dashed ${MF.hair2}`),
              padding: '6px 10px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: isNext ? `0 8px 18px rgba(201,132,43,0.35)` : 'none',
            }}>
              <div style={{
                fontFamily: F_MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5,
                color: isDone ? MF.paper : (isNext ? MF.ink : MF.ink2),
                opacity: isDone ? 0.75 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {isDone && <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1 4.5L3.5 7L8 1" stroke={MF.paper} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {isNext && <span style={{ fontWeight: 800, fontSize: 9, padding: '1px 4px', background: 'rgba(14,26,43,0.18)', borderRadius: 2 }}>NEXT</span>}
                {labelFor(s)}
              </div>
              <div style={{
                fontFamily: F_SANS, fontSize: 11, fontWeight: isNext ? 600 : 500,
                color: isDone ? MF.paper : (isNext ? MF.ink : MF.ink2),
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                marginTop: 1,
              }}>{s.topic}</div>
            </div>
          );
        })}

        <div style={{ position: 'absolute', left: `${xfor(nowH)}%`, top: 0, bottom: 18 }}>
          <div style={{ width: 1.5, height: '100%', background: MF.rust }} />
          <div style={{ position: 'absolute', top: -4, left: -3.5, width: 8, height: 8, borderRadius: 4, background: MF.rust }} />
          <div style={{
            position: 'absolute', top: -20, left: -18, width: 36,
            fontFamily: F_MONO, fontSize: 9.5, fontWeight: 700, color: MF.rust,
            letterSpacing: 0.6, textAlign: 'center',
          }}>NOW</div>
        </div>
      </div>
    </div>
  );
}

// ─── Streak: 16-day bars ─────────────────────────────────────

function StreakBars() {
  const days = [
    { d: 27, m: 'Apr', mins: 60,  weekday: 'M' },
    { d: 28, m: 'Apr', mins: 90,  weekday: 'T' },
    { d: 29, m: 'Apr', mins: 45,  weekday: 'W' },
    { d: 30, m: 'Apr', mins: 0,   weekday: 'T' },
    { d: 1,  m: 'May', mins: 75,  weekday: 'F' },
    { d: 2,  m: 'May', mins: 120, weekday: 'S' },
    { d: 3,  m: 'May', mins: 30,  weekday: 'S' },
    { d: 4,  m: 'May', mins: 90,  weekday: 'M', best: true },
    { d: 5,  m: 'May', mins: 60,  weekday: 'T' },
    { d: 6,  m: 'May', mins: 0,   weekday: 'W' },
    { d: 7,  m: 'May', mins: 45,  weekday: 'T' },
    { d: 8,  m: 'May', mins: 105, weekday: 'F' },
    { d: 9,  m: 'May', mins: 90,  weekday: 'S' },
    { d: 10, m: 'May', mins: 60,  weekday: 'S' },
    { d: 11, m: 'May', mins: 75,  weekday: 'M' },
    { d: 12, m: 'May', mins: 90,  weekday: 'T', today: true },
  ];
  const max = 120;
  const studied = days.filter(d => d.mins > 0).length;
  const totalMins = days.reduce((s,d) => s + d.mins, 0);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].mins > 0) streak++; else break;
  }

  return (
    <div style={{
      padding: '28px 32px', borderRadius: 16, background: MF.card,
      border: `1px solid ${MF.hair}`,
      display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'stretch',
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: F_SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: MF.amber }}>
              Last sixteen days
            </div>
            <h3 style={{ fontFamily: F_SERIF, fontSize: 26, color: MF.ink, margin: '8px 0 0', letterSpacing: -0.4, fontWeight: 400 }}>
              <span style={{ color: MF.amber, fontStyle: 'italic' }}>{streak}</span> in a row, <span style={{ color: MF.slate }}>·</span> {studied} of 16 days.
            </h3>
          </div>
          <div style={{ fontFamily: F_MONO, fontSize: 10.5, color: MF.slate, textAlign: 'right', lineHeight: 1.6 }}>
            <div>27 APR — 12 MAY</div>
            <div style={{ color: MF.ink }}>{(totalMins/60).toFixed(1)}h logged</div>
          </div>
        </div>

        <div style={{ marginTop: 28, position: 'relative', height: 130 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 28, height: 1, background: MF.hair2 }} />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 28 + (60/max) * 80,
            height: 1, borderTop: `1px dashed ${MF.hair2}`,
          }}>
            <span style={{
              position: 'absolute', right: 0, top: -16,
              fontFamily: F_MONO, fontSize: 9, color: MF.slate, letterSpacing: 0.4,
            }}>TARGET · 60m</span>
          </div>

          <div style={{
            position: 'absolute', inset: 0, display: 'grid',
            gridTemplateColumns: `repeat(${days.length}, 1fr)`, gap: 6,
            alignItems: 'end', paddingBottom: 28,
          }}>
            {days.map((d, i) => {
              const inStreak = i >= days.length - streak;
              const missed = d.mins === 0;
              const h = missed ? 6 : (d.mins / max) * 80;
              const color = missed ? MF.rust
                : d.today ? MF.amber
                : inStreak ? MF.amber
                : MF.ink;
              return (
                <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  {d.best && (
                    <div style={{
                      position: 'absolute', top: -2, fontFamily: F_MONO, fontSize: 8.5, fontWeight: 700,
                      color: MF.ink2, letterSpacing: 0.5, whiteSpace: 'nowrap',
                    }}>★ BEST</div>
                  )}
                  <div style={{
                    width: '100%', height: Math.max(h, 4),
                    background: missed ? 'transparent' : color,
                    border: missed ? `1px dashed ${MF.rust}` : 'none',
                    borderRadius: 2,
                    position: 'relative',
                  }}>
                    {d.today && (
                      <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: 3, background: MF.amber, boxShadow: `0 0 0 3px ${MF.amberSoft}` }} />
                    )}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, fontFamily: F_MONO,
                    fontSize: 10, color: d.today ? MF.ink : MF.slate,
                    fontWeight: d.today ? 700 : 500,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    paddingTop: 8,
                  }}>
                    <span style={{ fontSize: 8.5, opacity: 0.6 }}>{d.weekday}</span>
                    <span>{d.d}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{
        borderLeft: `1px solid ${MF.hair}`, paddingLeft: 28,
        display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'space-between',
      }}>
        <div>
          <Stat label="Current streak" value={`${streak}`} unit="days" tone="amber" hint="Best run: 9 days · May 4" />
          <div style={{ height: 16 }} />
          <Stat label="Days studied" value={`${studied}/16`} unit="" hint="One miss · May 6" />
          <div style={{ height: 16 }} />
          <Stat label="Hours logged" value={`${(totalMins/60).toFixed(1)}`} unit="h" hint="Avg 65 min per studied day" />
        </div>

        <div style={{
          padding: '12px 14px', borderRadius: 8,
          background: MF.paper, border: `1px solid ${MF.hair}`,
        }}>
          <div style={{ fontFamily: F_SERIF, fontSize: 14, color: MF.ink2, fontStyle: 'italic', lineHeight: 1.5 }}>
            "Holding above target six days running. The Feb sitting is on the calendar."
          </div>
          <div style={{ marginTop: 6, fontFamily: F_MONO, fontSize: 9.5, color: MF.slate, letterSpacing: 0.5 }}>
            COACH NOTE · 12 MAY
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, hint, tone }) {
  const valueColor = tone === 'amber' ? MF.amber : MF.ink;
  return (
    <div>
      <div style={{ fontFamily: F_SANS, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MF.slate }}>{label}</div>
      <div style={{ fontFamily: F_SERIF, fontSize: 36, color: valueColor, marginTop: 4, letterSpacing: -0.5, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {value}
        {unit && <span style={{ fontSize: 18, color: MF.slate, fontFamily: F_SERIF, fontStyle: 'italic' }}>{unit}</span>}
      </div>
      <div style={{ fontFamily: F_SANS, fontSize: 11.5, color: MF.ink2, marginTop: 4 }}>{hint}</div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

function Dashboard() {
  return (
    <div style={{ display: 'flex', height: '100%', background: MF.paper2, fontFamily: F_SANS }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <StudySessionHero />
        <div style={{ height: 18 }} />
        <DayRibbon />
        <div style={{ height: 18 }} />
        <StreakBars />
      </main>
    </div>
  );
}

Object.assign(window, { Dashboard });
