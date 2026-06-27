import { useState, useCallback } from 'react'
import { useScores } from '../hooks/useScores'
import Tetris      from '../components/games/Tetris'
import Snake       from '../components/games/Snake'
import Invaders    from '../components/games/Invaders'
import FlappyBird  from '../components/games/FlappyBird'
import Breakout    from '../components/games/Breakout'
import Runner      from '../components/games/Runner'
import Pong        from '../components/games/Pong'
import Game2048    from '../components/games/Game2048'
import MemoryMatch from '../components/games/MemoryMatch'
import Minesweeper from '../components/games/Minesweeper'
import Chess       from '../components/games/Chess'
import Sudoku      from '../components/games/Sudoku'

const GAMES = [
  { id:'tetris',   name:'TETRIS',         icon:'▦', hint:'↑ rotate · ↓ soft · SPC hard drop · TAB hold · P pause', hasLevel:true },
  { id:'snake',    name:'SNAKE',          icon:'◈', hint:'Arrow keys to steer', hasLevel:false },
  { id:'invaders', name:'INVADERS',       icon:'◉', hint:'← → move · Auto-fire · SPC extra shot', hasLevel:false },
  { id:'flappy',   name:'FLAPPY NEON',    icon:'◆', hint:'Space / click to flap', hasLevel:false },
  { id:'breakout', name:'BREAKOUT',       icon:'◫', hint:'← → move paddle', hasLevel:false },
  { id:'runner',   name:'RUNNER',         icon:'▶', hint:'Space / click to jump', hasLevel:false },
  { id:'pong',     name:'PONG',           icon:'◐', hint:'W/S or ↑/↓ to move · Space to start', hasLevel:false },
  { id:'2048',     name:'2048',           icon:'◧', hint:'Arrow keys or swipe to slide tiles', hasLevel:false },
  { id:'memory',   name:'MEMORY',         icon:'◈', hint:'Click cards to flip · match all pairs · fewer moves = higher score', hasLevel:false },
  { id:'mines',    name:'MINESWEEPER',    icon:'💣', hint:'Left click = reveal · Right click = flag · avoid the mines', hasLevel:false },
  { id:'chess',    name:'CHESS',          icon:'♟', hint:'Click piece then destination · You are White · Double-click to reset', hasLevel:false },
  { id:'sudoku',   name:'SUDOKU',         icon:'◉', hint:'Click cell then type 1-9 · N = note mode · Arrow keys to navigate', hasLevel:false },
]

export default function ArcadePage() {
  const [active,   setActive]   = useState(null)
  const [score,    setScore]    = useState(0)
  const [level,    setLevel]    = useState(1)
  const [gameKey,  setGameKey]  = useState(0)
  const [ended,    setEnded]    = useState(false)
  const [won,      setWon]      = useState(false)
  const [nameInput,setNameInput]= useState('')
  const [submitted,setSubmitted]= useState(false)

  const { getBest, getTop, addScore } = useScores()

  function openGame(g) {
    setActive(g); setScore(0); setLevel(1)
    setEnded(false); setWon(false)
    setSubmitted(false); setNameInput('')
    setGameKey(k => k+1)
    window.scrollTo({ top:0 })
  }

  function handleGameOver(s) { addScore(active.id, s); setScore(s); setEnded(true) }
  function handleWin(s)      { addScore(active.id, s); setScore(s); setEnded(true); setWon(true) }
  function handleScore(s,lv) { setScore(s); if(lv) setLevel(lv) }

  function submitName() {
    if (!nameInput.trim()) return
    addScore(active.id, score, nameInput.trim())
    setSubmitted(true)
  }

  function restart() {
    setScore(0); setLevel(1); setEnded(false); setWon(false)
    setSubmitted(false); setNameInput('')
    setGameKey(k => k+1)
  }

  function renderGame() {
    const props = { key: gameKey, onScore: handleScore, onGameOver: handleGameOver, onWin: handleWin }
    switch(active?.id) {
      case 'tetris':   return <Tetris    {...props}/>
      case 'snake':    return <Snake     {...props}/>
      case 'invaders': return <Invaders  {...props}/>
      case 'flappy':   return <FlappyBird {...props}/>
      case 'breakout': return <Breakout  {...props}/>
      case 'runner':   return <Runner    {...props}/>
      case 'pong':     return <Pong      {...props}/>
      case '2048':     return <Game2048  {...props}/>
    }
  }

  return (
    <>
      <style>{`
        .arc-page { padding-top:80px; min-height:100vh; }

        .arc-hero {
          padding:48px 0 32px; text-align:center;
          border-bottom:1px solid var(--border);
          background:radial-gradient(ellipse at 50% 100%,rgba(0,255,200,0.05) 0%,transparent 70%);
          position:relative;
        }
        .arc-ey { font-family:var(--mono); font-size:9px; letter-spacing:0.25em; text-transform:uppercase; color:rgba(0,255,200,0.5); margin-bottom:8px; }
        .arc-title { font-family:var(--mono); font-size:clamp(32px,7vw,64px); font-weight:bold; letter-spacing:0.15em; color:var(--accent); text-shadow:0 0 30px rgba(0,255,200,0.3); margin-bottom:8px; }
        .arc-sub { font-size:13px; color:var(--muted); }

        .game-strip {
          display:grid; grid-template-columns:repeat(5,1fr);
          border-bottom:1px solid var(--border);
        }
        .game-strip-btn {
          padding:14px 8px; text-align:center; border:none;
          border-right:1px solid var(--border); background:transparent;
          color:var(--muted); cursor:pointer; transition:all 0.15s; position:relative;
        }
        .game-strip-btn:last-child { border-right:none; }
        .game-strip-btn:hover, .game-strip-btn.active {
          color:var(--accent); background:rgba(0,255,200,0.04);
        }
        .game-strip-btn.active::after {
          content:''; position:absolute; bottom:0; left:0; right:0;
          height:2px; background:var(--accent); box-shadow:0 0 6px var(--accent);
        }
        .gs-icon { font-size:18px; display:block; margin-bottom:4px; }
        .gs-name { font-family:var(--mono); font-size:8px; letter-spacing:0.08em; display:block; }
        .gs-best { font-size:8px; color:rgba(0,255,200,0.35); margin-top:2px; display:block; font-family:var(--mono); }

        .play-area { display:grid; grid-template-columns:1fr 300px; min-height:60vh; }
        .play-left {
          border-right:1px solid var(--border);
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:28px; position:relative; gap:16px;
        }
        .play-right { padding:20px; overflow-y:auto; }

        .score-strip {
          display:flex; gap:28px; justify-content:center;
        }
        .score-box { text-align:center; }
        .score-lbl { font-family:var(--mono); font-size:8px; letter-spacing:0.2em; text-transform:uppercase; color:var(--muted); display:block; margin-bottom:2px; }
        .score-val { font-family:var(--mono); font-size:22px; color:var(--accent); font-weight:bold; }

        .game-canvas-wrap { position:relative; }
        .go-overlay {
          position:absolute; inset:0; background:rgba(3,5,10,0.88);
          display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:10px;
        }
        .go-title { font-family:var(--mono); font-size:20px; font-weight:bold; color:var(--accent); letter-spacing:0.15em; }
        .go-score { font-family:var(--mono); font-size:12px; color:var(--muted); }
        .go-hs    { font-family:var(--mono); font-size:11px; color:#ffcc00; }
        .go-name-row { display:flex; gap:6px; margin-top:4px; }
        .go-name-input {
          background:var(--surface2); border:1px solid var(--border);
          color:var(--text); font-family:var(--mono); font-size:11px;
          padding:6px 10px; outline:none; width:130px;
          transition:border-color 0.15s;
        }
        .go-name-input:focus { border-color:var(--accent); }
        .go-name-input::placeholder { color:var(--muted); }

        .neon-btn {
          font-family:var(--mono); font-size:10px; letter-spacing:0.12em;
          text-transform:uppercase; padding:8px 16px;
          border:1px solid var(--accent); background:transparent;
          color:var(--accent); cursor:pointer; transition:all 0.15s; border-radius:2px;
        }
        .neon-btn:hover { background:rgba(0,255,200,0.08); }
        .neon-btn.primary { background:var(--accent); color:var(--bg); font-weight:bold; }
        .neon-btn.primary:hover { box-shadow:0 0 16px rgba(0,255,200,0.4); }
        .neon-btn-row { display:flex; gap:6px; }

        .panel-lbl {
          font-family:var(--mono); font-size:8px; letter-spacing:0.2em;
          text-transform:uppercase; color:rgba(0,255,200,0.35);
          margin-bottom:8px; padding-bottom:6px;
          border-bottom:1px solid var(--border);
        }
        .panel-section { margin-bottom:20px; }
        .hint-text { font-family:var(--mono); font-size:10px; color:var(--muted); line-height:1.8; }

        .lb-row {
          display:flex; align-items:center; gap:8px;
          padding:5px 0; border-bottom:1px solid rgba(0,255,200,0.04);
          font-family:var(--mono); font-size:10px;
        }
        .lb-rank  { color:rgba(0,255,200,0.3); width:16px; }
        .lb-name  { color:var(--muted); flex:1; font-size:9px; }
        .lb-score { color:var(--accent); font-weight:bold; }

        .no-game {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:60px; color:var(--muted); text-align:center; gap:12px;
        }
        .no-game-icon { font-size:40px; opacity:0.15; font-family:var(--mono); }
        .no-game-text { font-family:var(--mono); font-size:11px; letter-spacing:0.15em; }

        .hall { border-top:1px solid var(--border); padding:36px 0; }
        .hall-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:0; border:1px solid var(--border); }
        .hall-col { padding:16px; border-right:1px solid var(--border); }
        .hall-col:last-child { border-right:none; }
        .hall-col-title { font-family:var(--mono); font-size:9px; letter-spacing:0.12em; text-transform:uppercase; color:var(--accent); margin-bottom:10px; }

        /* Mobile touch controls */
        .touch-controls {
          display:none; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:8px;
        }
        .touch-btn {
          width:44px; height:44px; background:rgba(0,255,200,0.06);
          border:1px solid rgba(0,255,200,0.2); color:var(--accent);
          font-size:18px; display:flex; align-items:center; justify-content:center;
          cursor:pointer; border-radius:2px; -webkit-user-select:none; user-select:none;
          transition:background 0.1s;
        }
        .touch-btn:active { background:rgba(0,255,200,0.15); }

        @media (max-width:960px) {
          .game-strip { grid-template-columns:repeat(5,1fr); }
          .play-area  { grid-template-columns:1fr; }
          .play-left  { border-right:none; border-bottom:1px solid var(--border); padding:16px; }
          .hall-grid  { grid-template-columns:repeat(2,1fr); }
          .touch-controls { display:flex; }
        }
        @media (max-width:600px) {
          .game-strip { grid-template-columns:repeat(5,1fr); }
          .hall-grid  { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="arc-page">
        {/* Hero */}
        <div className="arc-hero">
          <div className="arc-ey">// Entertainment module</div>
          <div className="arc-title">ARCADE</div>
          <div className="arc-sub">Eight games. Infinite runs. Global leaderboard.</div>
        </div>

        {/* Game strip */}
        <div className="game-strip">
          {GAMES.map(g => (
            <button key={g.id}
              className={`game-strip-btn ${active?.id===g.id?'active':''}`}
              onClick={() => openGame(g)}>
              <span className="gs-icon">{g.icon}</span>
              <span className="gs-name">{g.name}</span>
              <span className="gs-best">{getBest(g.id).toLocaleString()}</span>
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

                <div className="game-canvas-wrap">
                  {renderGame()}
                  {ended && (
                    <div className="go-overlay">
                      <div className="go-title">{won ? 'YOU WIN' : 'GAME OVER'}</div>
                      <div className="go-score">SCORE: {score.toLocaleString()}</div>
                      {score >= getBest(active.id) && score > 0 && (
                        <div className="go-hs">★ NEW HIGH SCORE</div>
                      )}
                      {!submitted ? (
                        <div className="go-name-row">
                          <input
                            className="go-name-input"
                            placeholder="Enter your name"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            onKeyDown={e => e.key==='Enter' && submitName()}
                            maxLength={16}
                          />
                          <button className="neon-btn primary" onClick={submitName}>Save</button>
                        </div>
                      ) : (
                        <div style={{fontFamily:'var(--mono)',fontSize:'10px',color:'var(--accent)'}}>
                          ✓ Score saved!
                        </div>
                      )}
                      <div className="neon-btn-row" style={{marginTop:'4px'}}>
                        <button className="neon-btn primary" onClick={restart}>RETRY</button>
                        <button className="neon-btn" onClick={() => setActive(null)}>MENU</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile touch controls */}
                {(active.id==='tetris'||active.id==='snake'||active.id==='breakout'||active.id==='invaders') && (
                  <div className="touch-controls">
                    <div style={{display:'flex',flexDirection:'column',gap:'4px',alignItems:'center'}}>
                      <button className="touch-btn" onTouchStart={()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}))}>↑</button>
                      <div style={{display:'flex',gap:'4px'}}>
                        <button className="touch-btn" onTouchStart={()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}))}>←</button>
                        <button className="touch-btn" onTouchStart={()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}))}>↓</button>
                        <button className="touch-btn" onTouchStart={()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))}>→</button>
                      </div>
                    </div>
                    <button className="touch-btn" style={{width:'80px',fontSize:'11px',fontFamily:'var(--mono)',letterSpacing:'0.1em'}}
                      onTouchStart={()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}))}>
                      SPC
                    </button>
                  </div>
                )}

                {(active.id==='flappy'||active.id==='runner') && (
                  <div className="touch-controls">
                    <button className="touch-btn" style={{width:'120px',fontSize:'11px',fontFamily:'var(--mono)'}}
                      onTouchStart={()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}))}>
                      TAP / JUMP
                    </button>
                  </div>
                )}
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
                  <div className="panel-lbl">// {active.name}</div>
                  <div className="hint-text">{active.hint}</div>
                </div>
                <div className="panel-section">
                  <div className="neon-btn-row">
                    <button className="neon-btn primary" onClick={restart}>Restart</button>
                    <button className="neon-btn" onClick={() => setActive(null)}>← Games</button>
                  </div>
                </div>
                <div className="panel-section">
                  <div className="panel-lbl">// Top scores</div>
                  {getTop(active.id).length
                    ? getTop(active.id).map((s,i) => (
                      <div className="lb-row" key={i}>
                        <span className="lb-rank">{i+1}.</span>
                        <span className="lb-name">{s.name || s.date}</span>
                        <span className="lb-score">{s.score.toLocaleString()}</span>
                      </div>
                    ))
                    : <div style={{fontFamily:'var(--mono)',fontSize:'10px',color:'var(--muted)',padding:'6px 0'}}>
                        No scores yet. Be first.
                      </div>
                  }
                </div>
              </>
            ) : (
              <div className="panel-section">
                <div className="panel-lbl">// All-time records</div>
                {GAMES.map(g => (
                  <div key={g.id} style={{marginBottom:'12px'}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:'9px',letterSpacing:'0.1em',color:'rgba(0,255,200,0.4)',marginBottom:'4px'}}>
                      {g.icon} {g.name}
                    </div>
                    {getTop(g.id,3).length
                      ? getTop(g.id,3).map((s,i) => (
                        <div className="lb-row" key={i}>
                          <span className="lb-rank">{i+1}.</span>
                          <span className="lb-name">{s.name || s.date}</span>
                          <span className="lb-score">{s.score.toLocaleString()}</span>
                        </div>
                      ))
                      : <div style={{fontFamily:'var(--mono)',fontSize:'9px',color:'var(--muted)'}}>—</div>
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hall of records */}
        <div className="hall">
          <div className="container">
            <div style={{fontFamily:'var(--mono)',fontSize:'9px',letterSpacing:'0.2em',color:'rgba(0,255,200,0.35)',marginBottom:'16px',textTransform:'uppercase'}}>
              // Hall of records
            </div>
            <div className="hall-grid">
              {GAMES.map(g => (
                <div className="hall-col" key={g.id}>
                  <div className="hall-col-title">{g.icon} {g.name}</div>
                  {getTop(g.id,5).length
                    ? getTop(g.id,5).map((s,i) => (
                      <div className="lb-row" key={i}>
                        <span className="lb-rank">{['①','②','③','④','⑤'][i]}</span>
                        <span className="lb-name">{s.name || s.date}</span>
                        <span className="lb-score">{s.score.toLocaleString()}</span>
                      </div>
                    ))
                    : <div style={{fontFamily:'var(--mono)',fontSize:'9px',color:'var(--muted)',padding:'6px 0'}}>No scores yet</div>
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
