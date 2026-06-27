import { useState, useEffect, useCallback } from 'react'

// ── Sudoku generator ──────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i=a.length-1;i>0;i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]]
  }
  return a
}

function isValid(board, row, col, num) {
  for (let i=0;i<9;i++) {
    if (board[row][i]===num) return false
    if (board[i][col]===num) return false
    const br=3*Math.floor(row/3)+Math.floor(i/3)
    const bc=3*Math.floor(col/3)+(i%3)
    if (board[br][bc]===num) return false
  }
  return true
}

function solve(board) {
  for (let r=0;r<9;r++) {
    for (let c=0;c<9;c++) {
      if (board[r][c]===0) {
        for (const n of shuffle([1,2,3,4,5,6,7,8,9])) {
          if (isValid(board,r,c,n)) {
            board[r][c]=n
            if (solve(board)) return true
            board[r][c]=0
          }
        }
        return false
      }
    }
  }
  return true
}

function generate(difficulty='medium') {
  const board = Array.from({length:9},()=>Array(9).fill(0))
  solve(board)
  const solution = board.map(r=>[...r])

  const remove = {easy:30, medium:45, hard:55}[difficulty]
  const cells  = shuffle(Array.from({length:81},(_,i)=>[Math.floor(i/9),i%9]))
  let removed  = 0
  for (const [r,c] of cells) {
    if (removed >= remove) break
    board[r][c] = 0
    removed++
  }
  return { puzzle: board, solution }
}

export default function Sudoku({ onScore, onGameOver, onWin }) {
  const [puzzle,     setPuzzle]     = useState(null)
  const [solution,   setSolution]   = useState(null)
  const [grid,       setGrid]       = useState(null)
  const [selected,   setSelected]   = useState(null)
  const [notes,      setNotes]      = useState(null) // 9x9 array of Sets
  const [noteMode,   setNoteMode]   = useState(false)
  const [errors,     setErrors]     = useState(new Set())
  const [difficulty, setDifficulty] = useState('medium')
  const [timer,      setTimer]      = useState(0)
  const [running,    setRunning]    = useState(false)
  const [won,        setWon]        = useState(false)
  const [mistakes,   setMistakes]   = useState(0)

  function newGame(diff=difficulty) {
    const { puzzle: p, solution: s } = generate(diff)
    setPuzzle(p.map(r=>[...r]))
    setSolution(s)
    setGrid(p.map(r=>[...r]))
    setNotes(Array.from({length:9},()=>Array.from({length:9},()=>new Set())))
    setSelected(null); setErrors(new Set())
    setTimer(0); setRunning(true); setWon(false); setMistakes(0)
  }

  useEffect(() => { newGame() }, [])

  // Timer
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setTimer(p=>p+1), 1000)
    return () => clearInterval(t)
  }, [running])

  function fmtTime(s) {
    const m = Math.floor(s/60)
    return `${m}:${String(s%60).padStart(2,'0')}`
  }

  function handleKey(num) {
    if (!selected || won) return
    const [r,c] = selected
    if (puzzle[r][c] !== 0) return // locked cell

    if (num === 0) {
      // Delete
      const ng = grid.map(row=>[...row])
      ng[r][c] = 0
      setGrid(ng)
      const ne = new Set(errors)
      ne.delete(`${r}-${c}`)
      setErrors(ne)
      return
    }

    if (noteMode) {
      const nn = notes.map((row,ri)=>row.map((set,ci)=>{
        if (ri===r&&ci===c) {
          const ns = new Set(set)
          ns.has(num) ? ns.delete(num) : ns.add(num)
          return ns
        }
        return set
      }))
      setNotes(nn)
      return
    }

    const ng = grid.map(row=>[...row])
    ng[r][c] = num
    setGrid(ng)

    // Check correct
    if (solution[r][c] !== num) {
      const ne = new Set(errors)
      ne.add(`${r}-${c}`)
      setErrors(ne)
      const m = mistakes + 1
      setMistakes(m)
      if (m >= 3) { setRunning(false); onGameOver(0) }
    } else {
      const ne = new Set(errors)
      ne.delete(`${r}-${c}`)
      setErrors(ne)
      // Check win
      const complete = ng.every((row,ri)=>row.every((v,ci)=>v===solution[ri][ci]))
      if (complete) {
        setWon(true); setRunning(false)
        const score = Math.max(1000 - timer*2 - mistakes*50, 100)
        onScore(score); onWin(score)
      }
    }
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (!selected) return
      const n = parseInt(e.key)
      if (n>=1&&n<=9) { handleKey(n); e.preventDefault() }
      if (e.key==='Backspace'||e.key==='Delete'||e.key==='0') { handleKey(0); e.preventDefault() }
      if (e.key==='n'||e.key==='N') setNoteMode(m=>!m)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, grid, notes, noteMode, won])

  if (!grid) return <div style={{color:'var(--accent)',fontFamily:'var(--mono)'}}>Loading...</div>

  const SQ = 44

  function cellColor(r, c) {
    const locked = puzzle[r][c] !== 0
    const err    = errors.has(`${r}-${c}`)
    const sel    = selected && selected[0]===r && selected[1]===c
    const same   = selected && !sel && grid[r][c]!==0 && grid[r][c]===grid[selected[0]][selected[1]]
    const region = selected && (Math.floor(r/3)===Math.floor(selected[0]/3) && Math.floor(c/3)===Math.floor(selected[1]/3))
    const line   = selected && (r===selected[0]||c===selected[1])

    if (sel)    return '#003020'
    if (err)    return '#1a0010'
    if (same)   return '#001a30'
    if (region || line) return '#0a1520'
    return (r+c)%2===0 ? '#0d1825' : '#0a1520'
  }

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',userSelect:'none'}}>
      <style>{`
        .sudoku-wrap { display:flex; flex-direction:column; align-items:center; gap:8px; }
        .sudoku-top  { display:flex; gap:20px; align-items:center; font-family:var(--mono); font-size:11px; }
        .sudoku-timer { color:var(--accent); letter-spacing:0.12em; }
        .sudoku-mistakes { color:#ff003c; }
        .sudoku-board { border:2px solid rgba(0,255,200,0.4); cursor:pointer; box-shadow:0 0 20px rgba(0,255,200,0.1); }
        .sudoku-numpad { display:grid; grid-template-columns:repeat(5,1fr); gap:4px; width:${SQ*9}px; }
        .num-btn {
          padding:8px 0; font-family:var(--mono); font-size:14px; font-weight:bold;
          border:1px solid rgba(0,255,200,0.2); background:transparent;
          color:var(--muted); cursor:pointer; transition:all 0.15s;
        }
        .num-btn:hover { border-color:var(--accent); color:var(--accent); background:rgba(0,255,200,0.06); }
        .num-btn.active { border-color:var(--accent); color:var(--accent); background:rgba(0,255,200,0.1); }
        .sudoku-row { display:flex; gap:8px; }
        .diff-btn {
          font-family:var(--mono); font-size:9px; letter-spacing:0.1em;
          text-transform:uppercase; padding:5px 10px;
          border:1px solid var(--border); background:transparent;
          color:var(--muted); cursor:pointer; transition:all 0.15s;
        }
        .diff-btn.active { border-color:var(--accent); color:var(--accent); }
        .diff-btn:hover  { border-color:var(--accent); color:var(--accent); }
      `}</style>

      <div className="sudoku-wrap">
        {/* Top bar */}
        <div className="sudoku-top">
          <span className="sudoku-timer">⏱ {fmtTime(timer)}</span>
          <span className="sudoku-mistakes">✗ {mistakes}/3</span>
          <span style={{color:'var(--muted)',fontSize:'10px',fontFamily:'var(--mono)'}}>
            {noteMode ? '📝 Note mode' : '✏ Normal mode'}
          </span>
        </div>

        {/* Board */}
        <svg className="sudoku-board" width={SQ*9} height={SQ*9}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const c = Math.floor((e.clientX-rect.left)/SQ)
            const r = Math.floor((e.clientY-rect.top)/SQ)
            if (r>=0&&r<9&&c>=0&&c<9) setSelected([r,c])
          }}>

          {/* Cells */}
          {grid.map((row,r)=>row.map((val,c)=>{
            const locked = puzzle[r][c] !== 0
            const err    = errors.has(`${r}-${c}`)
            const noteSet= notes[r][c]
            return (
              <g key={`${r}-${c}`}>
                <rect x={c*SQ} y={r*SQ} width={SQ} height={SQ} fill={cellColor(r,c)}/>
                {val !== 0 ? (
                  <text
                    x={c*SQ+SQ/2} y={r*SQ+SQ/2+9}
                    textAnchor="middle" fontSize={22}
                    fontFamily="monospace" fontWeight={locked?'bold':'normal'}
                    fill={err?'#ff003c':locked?'#e0f0ff':'#00ffc8'}>
                    {val}
                  </text>
                ) : (
                  // Notes
                  [...noteSet].map(n=>{
                    const nr=Math.floor((n-1)/3), nc=(n-1)%3
                    return (
                      <text key={n}
                        x={c*SQ+nc*(SQ/3)+SQ/6}
                        y={r*SQ+nr*(SQ/3)+SQ/4+2}
                        textAnchor="middle" fontSize={10}
                        fontFamily="monospace"
                        fill="rgba(0,255,200,0.5)">
                        {n}
                      </text>
                    )
                  })
                )}
              </g>
            )
          }))}

          {/* Grid lines */}
          {Array.from({length:10},(_,i)=>(
            <line key={`h${i}`} x1={0} y1={i*SQ} x2={SQ*9} y2={i*SQ}
              stroke={i%3===0?'rgba(0,255,200,0.5)':'rgba(0,255,200,0.12)'}
              strokeWidth={i%3===0?1.5:0.5}/>
          ))}
          {Array.from({length:10},(_,i)=>(
            <line key={`v${i}`} x1={i*SQ} y1={0} x2={i*SQ} y2={SQ*9}
              stroke={i%3===0?'rgba(0,255,200,0.5)':'rgba(0,255,200,0.12)'}
              strokeWidth={i%3===0?1.5:0.5}/>
          ))}
        </svg>

        {/* Number pad */}
        <div className="sudoku-numpad">
          {[1,2,3,4,5,6,7,8,9].map(n=>(
            <button key={n} className="num-btn" onClick={()=>handleKey(n)}>{n}</button>
          ))}
          <button
            className={`num-btn ${noteMode?'active':''}`}
            onClick={()=>setNoteMode(m=>!m)}
            title="Toggle note mode (N)">
            📝
          </button>
          <button className="num-btn" onClick={()=>handleKey(0)} title="Delete">⌫</button>
        </div>

        {/* Controls */}
        <div className="sudoku-row">
          {['easy','medium','hard'].map(d=>(
            <button key={d}
              className={`diff-btn ${difficulty===d?'active':''}`}
              onClick={()=>{ setDifficulty(d); newGame(d) }}>
              {d}
            </button>
          ))}
          <button className="diff-btn" onClick={()=>newGame()}>New</button>
        </div>

        {won && (
          <div style={{fontFamily:'var(--mono)',fontSize:'13px',color:'var(--accent)',
            letterSpacing:'0.1em',textAlign:'center'}}>
            ✓ Solved in {fmtTime(timer)}!
          </div>
        )}
      </div>
    </div>
  )
}
