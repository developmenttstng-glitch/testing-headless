import { useState, useEffect, useRef } from 'react'

// ── Alarm sounds using Web Audio API ─────────────────────────────────────────
// No external files needed — all generated in the browser
const SOUNDS = [
  { id: 'digital',   label: 'Digital Beep',     desc: 'Classic retro beep' },
  { id: 'pulse',     label: 'Neon Pulse',        desc: 'Sci-fi pulsing tone' },
  { id: 'siren',     label: 'Cyber Siren',       desc: 'Rising wail siren' },
  { id: 'chime',     label: 'Crystal Chime',     desc: 'Soft bell chime' },
  { id: 'glitch',    label: 'Glitch Burst',      desc: 'Distorted data burst' },
  { id: 'radar',     label: 'Radar Ping',        desc: 'Sonar ping sweep' },
]

function playSound(ctx, id) {
  if (!ctx) return
  const now = ctx.currentTime

  function beep(freq, start, dur, type='square', vol=0.3) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(vol, start + 0.01)
    gain.gain.linearRampToValueAtTime(0, start + dur)
    osc.start(start); osc.stop(start + dur + 0.05)
  }

  switch(id) {
    case 'digital':
      for(let i=0;i<6;i++) beep(880, now+i*0.2, 0.15, 'square', 0.25)
      break
    case 'pulse':
      for(let i=0;i<4;i++) {
        beep(440, now+i*0.4, 0.3, 'sine', 0.3)
        beep(660, now+i*0.4+0.15, 0.2, 'sine', 0.2)
      }
      break
    case 'siren': {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(300, now)
      osc.frequency.linearRampToValueAtTime(900, now+0.8)
      osc.frequency.linearRampToValueAtTime(300, now+1.6)
      osc.frequency.linearRampToValueAtTime(900, now+2.4)
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.linearRampToValueAtTime(0, now+2.4)
      osc.start(now); osc.stop(now+2.5)
      break
    }
    case 'chime':
      [523,659,784,1047].forEach((f,i) => beep(f, now+i*0.25, 0.6, 'sine', 0.25))
      break
    case 'glitch':
      for(let i=0;i<12;i++) beep(200+Math.random()*800, now+i*0.1, 0.08, 'sawtooth', 0.2)
      break
    case 'radar':
      for(let i=0;i<3;i++) {
        beep(1200, now+i*0.8, 0.05, 'sine', 0.3)
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1200, now+i*0.8)
        osc.frequency.exponentialRampToValueAtTime(200, now+i*0.8+0.6)
        gain.gain.setValueAtTime(0.2, now+i*0.8)
        gain.gain.linearRampToValueAtTime(0, now+i*0.8+0.6)
        osc.start(now+i*0.8+0.05); osc.stop(now+i*0.8+0.65)
      }
      break
  }
}

function fmt12(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}

function nowHM() {
  const d = new Date()
  return { h: d.getHours(), m: d.getMinutes() }
}

let audioCtx = null
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

export default function AlarmPage() {
  const [alarms,    setAlarms]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('neon_alarms') || '[]') } catch { return [] }
  })
  const [hour,      setHour]      = useState('07')
  const [minute,    setMinute]    = useState('00')
  const [label,     setLabel]     = useState('')
  const [sound,     setSound]     = useState('digital')
  const [repeat,    setRepeat]    = useState([])
  const [ringing,   setRinging]   = useState(null)  // alarm id that is ringing
  const tickRef   = useRef(null)
  const ringerRef = useRef(null)

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  function saveAlarms(next) {
    setAlarms(next)
    try { localStorage.setItem('neon_alarms', JSON.stringify(next)) } catch {}
  }

  function addAlarm() {
    const h = parseInt(hour), m = parseInt(minute)
    if (isNaN(h) || isNaN(m)) return
    const alarm = {
      id:      Date.now(),
      h, m,
      label:   label.trim() || 'Alarm',
      sound,
      repeat:  [...repeat],
      active:  true,
      snoozed: false,
    }
    saveAlarms([...alarms, alarm].sort((a,b) => a.h*60+a.m - (b.h*60+b.m)))
    setLabel(''); setRepeat([])
  }

  function toggleAlarm(id) {
    saveAlarms(alarms.map(a => a.id===id ? {...a, active:!a.active} : a))
  }

  function deleteAlarm(id) {
    saveAlarms(alarms.filter(a => a.id!==id))
  }

  function snooze() {
    if (!ringing) return
    saveAlarms(alarms.map(a => a.id===ringing
      ? {...a, snoozed:true, snoozeUntil: Date.now() + 5*60*1000 }
      : a
    ))
    stopRinging()
  }

  function dismiss() {
    if (!ringing) return
    // If not repeating, deactivate. If repeating, keep active.
    const alarm = alarms.find(a=>a.id===ringing)
    if (alarm && alarm.repeat.length === 0) {
      saveAlarms(alarms.map(a => a.id===ringing ? {...a, active:false} : a))
    } else {
      saveAlarms(alarms.map(a => a.id===ringing ? {...a, snoozed:false} : a))
    }
    stopRinging()
  }

  function stopRinging() {
    clearInterval(ringerRef.current)
    setRinging(null)
  }

  function startRinging(alarm) {
    setRinging(alarm.id)
    const ctx = getAudioCtx()
    playSound(ctx, alarm.sound)
    ringerRef.current = setInterval(() => playSound(ctx, alarm.sound), 3000)
  }

  function toggleDay(d) {
    setRepeat(prev =>
      prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d]
    )
  }

  // Clock tick — check alarms every 10 seconds
  useEffect(() => {
    tickRef.current = setInterval(() => {
      const now = new Date()
      const h = now.getHours(), m = now.getMinutes(), day = now.getDay()
      alarms.forEach(alarm => {
        if (!alarm.active || ringing) return
        if (alarm.snoozed) {
          if (alarm.snoozeUntil && Date.now() >= alarm.snoozeUntil) {
            saveAlarms(prev => prev.map(a => a.id===alarm.id ? {...a, snoozed:false} : a))
          }
          return
        }
        if (alarm.h === h && alarm.m === m) {
          if (alarm.repeat.length === 0 || alarm.repeat.includes(day)) {
            startRinging(alarm)
          }
        }
      })
    }, 10000)
    return () => clearInterval(tickRef.current)
  }, [alarms, ringing])

  function previewSound() {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    playSound(ctx, sound)
  }

  const hours   = Array.from({length:24},(_,i)=>String(i).padStart(2,'0'))
  const minutes = Array.from({length:60},(_,i)=>String(i).padStart(2,'0'))

  return (
    <>
      <style>{`
        .alarm-page { padding-top: 80px; min-height: 100vh; }

        .alarm-hero {
          padding: 40px 0 28px; border-bottom: 1px solid var(--border);
          background: radial-gradient(ellipse at 80% 0%, rgba(191,0,255,0.05) 0%, transparent 60%);
        }
        .alarm-ey { font-family:var(--mono); font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(191,0,255,0.6); margin-bottom:8px; }
        .alarm-title { font-family:var(--mono); font-size:clamp(28px,5vw,52px); font-weight:bold; color:var(--text); letter-spacing:0.08em; }

        .alarm-layout { display:grid; grid-template-columns:380px 1fr; gap:0; }

        /* ADD ALARM PANEL */
        .add-panel {
          border-right:1px solid var(--border);
          padding:28px 24px;
        }
        .add-section-title {
          font-family:var(--mono); font-size:9px; letter-spacing:0.2em;
          text-transform:uppercase; color:rgba(191,0,255,0.5); margin-bottom:16px;
          padding-bottom:8px; border-bottom:1px solid var(--border);
        }

        /* Time picker */
        .time-picker { display:flex; align-items:center; gap:8px; margin-bottom:20px; }
        .time-select {
          background:var(--surface2); border:1px solid var(--border); color:var(--text);
          font-family:var(--mono); font-size:28px; font-weight:bold;
          padding:10px 8px; outline:none; cursor:pointer; text-align:center;
          flex:1; transition:border-color 0.15s; color:var(--accent);
        }
        .time-select:focus { border-color:var(--accent); }
        .time-colon { font-family:var(--mono); font-size:28px; color:var(--accent); font-weight:bold; }

        /* Label */
        .alarm-label-input {
          width:100%; background:var(--surface2); border:1px solid var(--border);
          color:var(--text); font-family:var(--mono); font-size:12px;
          padding:9px 12px; outline:none; transition:border-color 0.15s; margin-bottom:16px;
        }
        .alarm-label-input:focus { border-color:var(--accent); }
        .alarm-label-input::placeholder { color:var(--muted); }

        /* Sound picker */
        .sound-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:16px; }
        .sound-btn {
          padding:8px 10px; border:1px solid var(--border);
          background:transparent; cursor:pointer; transition:all 0.15s;
          text-align:left;
        }
        .sound-btn:hover { border-color:rgba(191,0,255,0.4); }
        .sound-btn.selected { border-color:#bf00ff; background:rgba(191,0,255,0.08); }
        .sound-name { font-family:var(--mono); font-size:11px; color:var(--text); display:block; margin-bottom:1px; }
        .sound-desc { font-size:10px; color:var(--muted); }
        .sound-selected .sound-name { color:#bf00ff; }

        .preview-btn {
          font-family:var(--mono); font-size:9px; letter-spacing:0.12em;
          text-transform:uppercase; background:transparent;
          border:1px solid rgba(191,0,255,0.3); color:rgba(191,0,255,0.7);
          padding:6px 12px; cursor:pointer; transition:all 0.15s; margin-bottom:16px;
        }
        .preview-btn:hover { border-color:#bf00ff; color:#bf00ff; background:rgba(191,0,255,0.06); }

        /* Repeat days */
        .field-lbl { font-family:var(--mono); font-size:8px; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
        .days-row { display:flex; gap:4px; margin-bottom:20px; }
        .day-btn {
          flex:1; padding:6px 4px; font-family:var(--mono); font-size:10px;
          border:1px solid var(--border); background:transparent; color:var(--muted);
          cursor:pointer; transition:all 0.15s; text-align:center;
        }
        .day-btn:hover { border-color:rgba(191,0,255,0.4); color:rgba(191,0,255,0.7); }
        .day-btn.on { border-color:#bf00ff; background:rgba(191,0,255,0.1); color:#bf00ff; }

        /* Add button */
        .add-btn {
          width:100%; padding:13px; background:#bf00ff; color:white;
          border:none; font-family:var(--mono); font-size:11px;
          letter-spacing:0.18em; text-transform:uppercase; font-weight:bold;
          cursor:pointer; transition:all 0.15s;
          box-shadow:0 0 20px rgba(191,0,255,0.25);
        }
        .add-btn:hover { box-shadow:0 0 32px rgba(191,0,255,0.5); }

        /* ALARMS LIST */
        .alarms-list { padding:24px; }
        .alarms-empty {
          padding:60px 0; text-align:center;
          font-family:var(--mono); font-size:11px; color:var(--muted); letter-spacing:0.12em;
        }
        .alarm-card {
          display:flex; align-items:center; gap:16px; padding:16px;
          border:1px solid var(--border); margin-bottom:8px;
          background:var(--surface); transition:all 0.15s;
        }
        .alarm-card:hover { border-color:rgba(191,0,255,0.2); }
        .alarm-card.inactive { opacity:0.45; }
        .alarm-time { font-family:var(--mono); font-size:24px; font-weight:bold; color:var(--text); min-width:100px; }
        .alarm-card.inactive .alarm-time { color:var(--muted); }
        .alarm-info { flex:1; min-width:0; }
        .alarm-lbl-text { font-size:13px; color:var(--text); margin-bottom:3px; }
        .alarm-meta { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .alarm-sound-tag {
          font-family:var(--mono); font-size:9px; letter-spacing:0.1em;
          text-transform:uppercase; color:rgba(191,0,255,0.6);
          border:1px solid rgba(191,0,255,0.2); padding:2px 7px;
        }
        .alarm-day-tag {
          font-family:var(--mono); font-size:9px; color:var(--muted);
        }
        .alarm-toggle {
          width:44px; height:24px; border-radius:12px; position:relative;
          cursor:pointer; transition:all 0.2s; border:none; flex-shrink:0;
          background:var(--surface2);
        }
        .alarm-toggle.on { background:#bf00ff; box-shadow:0 0 8px rgba(191,0,255,0.4); }
        .alarm-toggle::after {
          content:''; position:absolute; width:18px; height:18px; border-radius:50%;
          background:white; top:3px; left:3px; transition:transform 0.2s;
        }
        .alarm-toggle.on::after { transform:translateX(20px); }
        .alarm-delete {
          background:none; border:none; color:var(--muted); cursor:pointer;
          font-size:18px; padding:4px; transition:color 0.15s; flex-shrink:0;
        }
        .alarm-delete:hover { color:#ff003c; }

        /* RINGING MODAL */
        .ring-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.9);
          z-index:500; display:flex; align-items:center; justify-content:center;
          animation:ringFade 0.3s ease;
        }
        @keyframes ringFade { from{opacity:0} to{opacity:1} }
        .ring-modal {
          background:var(--surface2); border:2px solid #bf00ff;
          padding:40px; text-align:center; max-width:340px; width:100%;
          box-shadow:0 0 60px rgba(191,0,255,0.4);
          animation:ringPulse 1s ease infinite alternate;
        }
        @keyframes ringPulse { from{box-shadow:0 0 40px rgba(191,0,255,0.3)} to{box-shadow:0 0 80px rgba(191,0,255,0.7)} }
        .ring-icon { font-size:48px; margin-bottom:16px; animation:ringShake 0.5s ease infinite; }
        @keyframes ringShake { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
        .ring-time { font-family:var(--mono); font-size:40px; font-weight:bold; color:#bf00ff; margin-bottom:8px; }
        .ring-label { font-size:18px; color:var(--text); margin-bottom:28px; }
        .ring-btns { display:flex; gap:10px; justify-content:center; }
        .ring-snooze {
          padding:12px 24px; border:1px solid rgba(191,0,255,0.4);
          background:transparent; color:#bf00ff; font-family:var(--mono);
          font-size:11px; letter-spacing:0.15em; text-transform:uppercase;
          cursor:pointer; transition:all 0.15s;
        }
        .ring-snooze:hover { background:rgba(191,0,255,0.1); }
        .ring-dismiss {
          padding:12px 24px; background:#bf00ff; color:white; border:none;
          font-family:var(--mono); font-size:11px; letter-spacing:0.15em;
          text-transform:uppercase; font-weight:bold; cursor:pointer;
          transition:all 0.15s;
        }
        .ring-dismiss:hover { box-shadow:0 0 20px rgba(191,0,255,0.5); }

        @media (max-width:860px) {
          .alarm-layout { grid-template-columns:1fr; }
          .add-panel { border-right:none; border-bottom:1px solid var(--border); }
        }
      `}</style>

      <div className="alarm-page">
        <div className="alarm-hero">
          <div className="container">
            <div className="alarm-ey">// Time module</div>
            <div className="alarm-title">ALARMS</div>
          </div>
        </div>

        <div className="alarm-layout">

          {/* ── ADD ALARM ── */}
          <div className="add-panel">
            <div className="add-section-title">// Set alarm</div>

            <div className="time-picker">
              <select className="time-select" value={hour} onChange={e=>setHour(e.target.value)}>
                {hours.map(h=><option key={h} value={h}>{h}</option>)}
              </select>
              <span className="time-colon">:</span>
              <select className="time-select" value={minute} onChange={e=>setMinute(e.target.value)}>
                {minutes.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <input
              className="alarm-label-input"
              type="text"
              placeholder="Alarm label (optional)"
              value={label}
              onChange={e=>setLabel(e.target.value)}
              maxLength={32}
            />

            <div className="field-lbl">// Alarm sound</div>
            <div className="sound-grid">
              {SOUNDS.map(s=>(
                <button
                  key={s.id}
                  className={`sound-btn ${sound===s.id?'selected sound-selected':''}`}
                  onClick={()=>setSound(s.id)}>
                  <span className="sound-name">{s.label}</span>
                  <span className="sound-desc">{s.desc}</span>
                </button>
              ))}
            </div>
            <button className="preview-btn" onClick={previewSound}>
              ▶ Preview sound
            </button>

            <div className="field-lbl">// Repeat (optional)</div>
            <div className="days-row">
              {DAYS.map((d,i)=>(
                <button
                  key={d}
                  className={`day-btn ${repeat.includes(i)?'on':''}`}
                  onClick={()=>toggleDay(i)}>
                  {d[0]}
                </button>
              ))}
            </div>

            <button className="add-btn" onClick={addAlarm}>
              + Add alarm
            </button>
          </div>

          {/* ── ALARMS LIST ── */}
          <div className="alarms-list">
            <div className="add-section-title">
              // My alarms ({alarms.length})
            </div>

            {alarms.length === 0 ? (
              <div className="alarms-empty">
                <div style={{fontSize:'32px',marginBottom:'12px',opacity:0.2}}>⏰</div>
                No alarms set.<br/>Add your first alarm on the left.
              </div>
            ) : (
              alarms.map(alarm => (
                <div key={alarm.id} className={`alarm-card ${!alarm.active?'inactive':''}`}>
                  <div className="alarm-time">{fmt12(alarm.h, alarm.m)}</div>
                  <div className="alarm-info">
                    <div className="alarm-lbl-text">{alarm.label}</div>
                    <div className="alarm-meta">
                      <span className="alarm-sound-tag">
                        {SOUNDS.find(s=>s.id===alarm.sound)?.label || alarm.sound}
                      </span>
                      {alarm.repeat.length > 0 && (
                        <span className="alarm-day-tag">
                          {alarm.repeat.map(d=>DAYS[d]).join(' · ')}
                        </span>
                      )}
                      {alarm.snoozed && (
                        <span style={{fontFamily:'var(--mono)',fontSize:'9px',color:'#ffcc00'}}>
                          SNOOZED 5min
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={`alarm-toggle ${alarm.active?'on':''}`}
                    onClick={()=>toggleAlarm(alarm.id)}
                    title={alarm.active?'Disable alarm':'Enable alarm'}
                  />
                  <button className="alarm-delete" onClick={()=>deleteAlarm(alarm.id)} title="Delete alarm">
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── RINGING MODAL ── */}
      {ringing && (() => {
        const alarm = alarms.find(a=>a.id===ringing)
        return alarm ? (
          <div className="ring-overlay">
            <div className="ring-modal">
              <div className="ring-icon">⏰</div>
              <div className="ring-time">{fmt12(alarm.h, alarm.m)}</div>
              <div className="ring-label">{alarm.label}</div>
              <div className="ring-btns">
                <button className="ring-snooze" onClick={snooze}>Snooze 5m</button>
                <button className="ring-dismiss" onClick={dismiss}>Dismiss</button>
              </div>
            </div>
          </div>
        ) : null
      })()}
    </>
  )
}
