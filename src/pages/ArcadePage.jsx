import { useState } from 'react'
import { useScores } from '../hooks/useScores'
import Tetris from '../components/games/Tetris'
import Snake from '../components/games/Snake'
import Invaders from '../components/games/Invaders'
import FlappyBird from '../components/games/FlappyBird'
import Breakout from '../components/games/Breakout'

const GAMES = [
  { id:'tetris',   name:'TETRIS',          sub:'Stack & clear',      icon:'▦', hint:'Arrows + Space to pause', hasLevel:true },
  { id:'snake',    name:'SNAKE',           sub:'Eat & grow',         icon:'◈', hint:'Arrow keys',              hasLevel:false },
  { id:'invaders', name:'INVADERS',        sub:'Defend the grid',    icon:'◉', hint:'Arrows + Space to shoot', hasLevel:false },
  { id:'flappy',   name:'FLAPPY NEON',     sub:'Fly through gates',  icon:'◆', hint:'Space / Click to flap',   hasLevel:false },
  { id:'breakout', name:'BREAKOUT',        sub:'Smash the matrix',   icon:'◫', hint:'Arrow keys',              hasLevel:false },
]

export default function ArcadePage() {
  const [active,  setActive]  = useState(null)
  const [score,   setScore]   = useState(0)
  const [level,   setLevel]   = useState(1)
  const [gameKey, setGameKey] = useState(0)
  const [ended,   setEnded]   = useState(false)
  const [won,     setWon]     = useState(false)

  const { getBest, getTop, addScore } = useScores()

  function openGame(g) {
    setActive(g); setScore(0); setLevel(1)
    setEnded(false); setWon(false)
    setGameKey(k => k + 1)
    window.scrollTo({ top: 0 })
  }

  function handleGameOver(s) { addScore(active.id, s); setScore(s); setEnded(true) }
  function handleWin(s)      { addScore(active.id, s); setScore(s); setEnded(true); setWon(true) }
  function handleScore(s, lv){ setScore(s); if (lv) setLevel(lv) }
  function restart()         { setScore(0); setLevel(1); setEnded(false); setWon(false); setGameKey(k=>k+1) }

  function renderGame() {
    const props = { key: gameKey, onScore: handleScore, onGameOver: handleGameOver, onWin: handleWin }
    switch(active?.id) {
      case 'tetris':   return <Tetris    {...props}/>
      case 'snake':    return <Snake     {...props}/>
      case 'invaders': return <Invaders  {...props}/>
      case 'flappy':   return <FlappyBird {...props}/>
      case 'breakout': return <Breakout  {...props}/>
    }
  }

  return (
    <>
      <style>{`
        .arcade-page { padding-top:80px; min-height:100vh; }

        /* HERO */
        .arcade-hero {
          padding:60px 0 40px; text-align:center;
          border-bottom:1px solid var(--border);
          position:relative; overflow:hidden;
        }
        .arcade-hero::before {
          content:'';
          position:absolute; inset:0;
          background:radial-gradient(ellipse at 50% 100%, rgba(0,255,200,0.06) 0%, transparent 70%);
        }
        .arcade-eyebrow {
          font-family:var(--mono); font-size:10px; letter-spacing:0.25em;
          text-transform:uppercase; color:var(--accent); margin-bottom:12px;
          opacity:0.7;
        }
        .arcade-title {
          font-family:var(--mono); font-size:clamp(36px,7vw,72px);
          font-weight:bold; letter-spacing:0.2em; color:var(--accent);
          text-shadow:0 0 40px rgba(0,255,200,0.4);
          margin-bottom:12px;
        }
        .arcade-sub { font-size:14px; color:var(--muted); letter-spacing:0.05em; }

        /* GAME SELECT GRID */
        .game-select {
          display:grid; grid-template-columns:repeat(5,1fr);
          gap:0; border-bottom:1px solid var(--border);
        }
        .game-select-btn {
          padding:20px 16px; text-align:center;
          border-right:1px solid var(--border);
          background:transparent; border-top:none; border-left:none; border-bottom:none;
          color:var(--muted); cursor:pointer;
          transition:all 0.15s; position:relative; overflow:hidden;
        }
        .game-select-btn:last-child { border-right:none; }
        .game-select-btn:hover, .game-select-btn.active {
          color:var(--accent); background:rgba(0,255,200,0.04);
        }
        .game-select-btn.active::after {
          content:''; position:absolute; bottom:0; left:0; right:0;
          height:2px; background:var(--accent);
          box-shadow:0 0 8px var(--accent);
        }
        .gs-icon { font-size:22px; display:block; margin-bottom:6px; }
        .gs-name { font-family:var(--mono); font-size:10px; letter-spacing:0.1em; display:block; }
        .gs-best { font-size:9px; color:rgba(0,255,200,0.4); margin-top:3px; display:block; font-family:var(--mono); }

        /* PLAY AREA */
        .play-area {
          display:grid; grid-template-columns:1fr 320px;
          gap:0; min-height:60vh;
        }
        .play-left {
          border-right:1px solid var(--border);
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:32px; position:relative;
        }
        .play-right { padding:24px; }

        /* Score display */
        .score-strip {
          display:flex; gap:32px; margin-bottom:20px; width:100%;
          justify-content:center;
        }
        .score-box { text-align:center; }
        .score-lbl {
          font-family:var(--mono); font-size:8px; letter-spacing:0.2em;
          text-transform:uppercase; color:var(--muted); display:block; margin-bottom:2px;
        }
        .score-val {
          font-family:var(--mono); font-size:24px; color:var(--accent);
          font-weight:bold; text-shadow:0 0 12px rgba(0,255,200,0.4);
        }

        /* Game over overlay */
        .go-overlay {
          position:absolute; inset:0;
          background:rgba(3,5,10,0.88);
          display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:10px;
        }
        .go-title {
          font-family:var(--mono); font-size:22px; font-weight:bold;
          color:var(--accent); text-shadow:0 0 20px rgba(0,255,200,0.5);
          letter-spacing:0.15em;
        }
        .go-score { font-family:var(--mono); font-size:13px; color:var(--muted); }
        .go-hs { font-family:var(--mono); font-size:11px; color:#ffcc00; }

        /* Buttons */
        .neon-btn {
          font-family:var(--mono); font-size:10px; letter-spacing:0.15em;
          text-transform:uppercase; padding:10px 20px;
          border:1px solid var(--accent); background:transparent;
          color:var(--accent); transition:all 0.15s; border-radius:2px;
        }
        .neon-btn:hover { background:rgba(0,255,200,0.1); box-shadow:0 0 12px rgba(0,255,200,0.2); }
        .neon-btn.primary { background:var(--accent); color:var(--bg); font-weight:bold; }
        .neon-btn.primary:hover { box-shadow:0 0 20px rgba(0,255,200,0.5); }

        /* Right panel */
        .panel-section { margin-bottom:24px; }
        .panel-title {
          font-family:var(--mono); font-size:9px; letter-spacing:0.2em;
          text-transform:uppercase; color:rgba(0,255,200,0.4);
          margin-bottom:10px; padding-bottom:6px;
          border-bottom:1px solid var(--border);
        }
        .hint-text {
          font-family:var(--mono); font-size:10px; color:var(--muted);
          line-height:1.8; letter-spacing:0.05em;
        }

        /* Leaderboard */
        .lb-row {
          display:flex; align-items:center; gap:10px;
          padding:6px 0; border-bottom:1px solid rgba(0,255,200,0.04);
          font-family:var(--mono); font-size:11px;
        }
        .lb-rank { color:rgba(0,255,200,0.3); width:18px; }
        .lb-date { color:var(--muted); flex:1; font-size:10px; }
        .lb-score { color:var(--accent); font-weight:bold; }

        /* Empty state */
        .no-game {
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:60px; color:var(--muted); text-align:center;
        }
        .no-game-icon { font-size:48px; margin-bottom:16px; opacity:0.2; font-family:var(--mono); }
        .no-game-text { font-family:var(--mono); font-size:11px; letter-spacing:0.15em; }

        /* All scores section */
        .all-scores { border-top:1px solid var(--border); padding:40px 0; }
        .all-scores-grid {
          display:grid; grid-template-columns:repeat(5,1fr); gap:0;
          border:1px solid var(--border);
        }
        .score-col {
          padding:20px 16px; border-right:1px solid var(--border);
        }
        .score-col:last-child { border-right:none; }
        .score-col-title {
          font-family:var(--mono); font-size:10px; letter-spacing:0.12em;
          text-transform:uppercase; color:var(--accent); margin-bottom:12px;
        }

        @media (max-width:900px) {
          .game-select { grid-template-columns:repeat(3,1fr); }
          .play-area { grid-template-columns:1fr; }
          .play-left { border-right:none; border-bottom:1px solid var(--border); }
          .all-scores-grid { grid-template-columns:1fr 1fr; }
        }
        @media (max-width:600px) {
          .game-select { grid-template-columns:repeat(3,1fr); }
          .all-scores-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="arcade-page">
        {/* Hero */}
        <div className="arcade-hero">
          <div className="container">
            <div className="arcade-eyebrow">// Entertainment module</div>
            <div className="arcade-title">ARCADE</div>
            <div className="arcade-sub">Five games. Infinite runs. Global leaderboard.</div>
          </div>
        </div>

        {/* Game select strip */}
        <div className="game-select">
          {GAMES.map(g => (
            <button key={g.id}
              className={`game-select-btn ${active?.id===g.id?'active':''}`}
              onClick={() => openGame(g)}>
              <span className="gs-icon">{g.icon}</span>
              <span className="gs-name">{g.name}</span>
              <span className="gs-best">BEST: {getBest(g.id).toLocaleString()}</span>
            </button>
          ))}
        </div>

        {/* Play area */}
        <div className="play-area">
          <div className="play-left">
            {active ? (
              <>
                <div className="score-strip">
                  <div className="score-box">
                    <span className="score-lbl">Score</span>
                    <span className="score-val">{score.toLocaleString()}</span>
                  </div>
                  <div className="score-box">
                    <span className="score-lbl">Best</span>
                    <span className="score-val">{Math.max(getBest(active.id),score).toLocaleString()}</span>
                  </div>
                  {active.hasLevel && (
                    <div className="score-box">
                      <span className="score-lbl">Level</span>
                      <span className="score-val">{level}</span>
                    </div>
                  )}
                </div>

                <div style={{position:'relative'}}>
                  {renderGame()}
                  {ended && (
                    <div className="go-overlay">
                      <div className="go-title">{won ? 'YOU WIN' : 'GAME OVER'}</div>
                      <div className="go-score">SCORE: {score.toLocaleString()}</div>
                      {score > 0 && score >= getBest(active.id) && (
                        <div className="go-hs">★ NEW HIGH SCORE</div>
                      )}
                      <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                        <button className="neon-btn primary" onClick={restart}>RETRY</button>
                        <button className="neon-btn" onClick={() => setActive(null)}>MENU</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-game">
                <div className="no-game-icon">▦</div>
                <div className="no-game-text">SELECT A GAME ABOVE</div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="play-right">
            {active ? (
              <>
                <div className="panel-section">
                  <div className="panel-title">// {active.name}</div>
                  <div className="hint-text" style={{marginBottom:'8px',color:'var(--text)'}}>{active.sub}</div>
                  <div className="hint-text">{active.hint}</div>
                </div>

                <div className="panel-section">
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <button className="neon-btn primary" onClick={restart}>RESTART</button>
                    <button className="neon-btn" onClick={() => setActive(null)}>← GAMES</button>
                  </div>
                </div>

                <div className="panel-section">
                  <div className="panel-title">// Top scores — {active.name}</div>
                  {getTop(active.id).length
                    ? getTop(active.id).map((s,i) => (
                      <div className="lb-row" key={i}>
                        <span className="lb-rank">{i+1}.</span>
                        <span className="lb-date">{s.date}</span>
                        <span className="lb-score">{s.score.toLocaleString()}</span>
                      </div>
                    ))
                    : <div style={{fontFamily:'var(--mono)',fontSize:'10px',color:'var(--muted)',padding:'8px 0'}}>
                        No scores yet. Be first.
                      </div>
                  }
                </div>
              </>
            ) : (
              <div className="panel-section">
                <div className="panel-title">// All-time records</div>
                {GAMES.map(g => (
                  <div key={g.id} style={{marginBottom:'14px'}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:'9px',letterSpacing:'0.12em',
                      color:'rgba(0,255,200,0.5)',marginBottom:'5px'}}>
                      {g.icon} {g.name}
                    </div>
                    {getTop(g.id,3).length
                      ? getTop(g.id,3).map((s,i) => (
                        <div className="lb-row" key={i}>
                          <span className="lb-rank">{i+1}.</span>
                          <span className="lb-date">{s.date}</span>
                          <span className="lb-score">{s.score.toLocaleString()}</span>
                        </div>
                      ))
                      : <div style={{fontFamily:'var(--mono)',fontSize:'10px',color:'var(--muted)'}}>—</div>
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All scores section */}
        <div className="all-scores">
          <div className="container">
            <div style={{fontFamily:'var(--mono)',fontSize:'9px',letterSpacing:'0.2em',
              color:'rgba(0,255,200,0.4)',marginBottom:'20px',textTransform:'uppercase'}}>
              // Hall of records
            </div>
            <div className="all-scores-grid">
              {GAMES.map(g => (
                <div className="score-col" key={g.id}>
                  <div className="score-col-title">{g.icon} {g.name}</div>
                  {getTop(g.id,5).length
                    ? getTop(g.id,5).map((s,i) => (
                      <div className="lb-row" key={i}>
                        <span className="lb-rank">{['①','②','③','④','⑤'][i]}</span>
                        <span className="lb-score">{s.score.toLocaleString()}</span>
                      </div>
                    ))
                    : <div style={{fontFamily:'var(--mono)',fontSize:'9px',color:'var(--muted)',padding:'8px 0'}}>No scores yet</div>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
