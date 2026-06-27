import { useState, useCallback } from 'react'

// ── Piece definitions ─────────────────────────────────────────────────────────
const PIECES = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟',
}

const INIT_BOARD = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
]

function color(piece) { return piece ? piece[0] : null }
function type(piece)  { return piece ? piece[1] : null }
function enemy(piece, turn) { return piece && color(piece) !== turn }
function ally(piece, turn)  { return piece && color(piece) === turn }

function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8 }

function getMoves(board, r, c, enPassant, castling) {
  const piece = board[r][c]
  if (!piece) return []
  const col   = color(piece)
  const pt    = type(piece)
  const moves = []

  function add(nr, nc) {
    if (!inBounds(nr, nc)) return false
    if (ally(board[nr][nc], col)) return false
    moves.push([nr, nc])
    return !board[nr][nc]
  }

  function slide(dr, dc) {
    let nr = r+dr, nc = c+dc
    while (inBounds(nr, nc)) {
      if (ally(board[nr][nc], col)) break
      moves.push([nr, nc])
      if (board[nr][nc]) break
      nr += dr; nc += dc
    }
  }

  if (pt === 'P') {
    const dir   = col === 'w' ? -1 : 1
    const start = col === 'w' ? 6   : 1
    if (inBounds(r+dir, c) && !board[r+dir][c]) {
      moves.push([r+dir, c])
      if (r === start && !board[r+dir*2][c]) moves.push([r+dir*2, c])
    }
    for (const dc of [-1, 1]) {
      if (inBounds(r+dir, c+dc)) {
        if (enemy(board[r+dir][c+dc], col)) moves.push([r+dir, c+dc])
        if (enPassant && enPassant[0]===r+dir && enPassant[1]===c+dc) moves.push([r+dir, c+dc])
      }
    }
  } else if (pt === 'N') {
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r+dr,c+dc)
  } else if (pt === 'B') {
    for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,dc)
  } else if (pt === 'R') {
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc)
  } else if (pt === 'Q') {
    for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc)
  } else if (pt === 'K') {
    for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r+dr,c+dc)
    // Castling
    if (castling) {
      const row = col === 'w' ? 7 : 0
      if (r === row && c === 4) {
        if (castling[col+'K'] && !board[row][5] && !board[row][6]) moves.push([row,6])
        if (castling[col+'Q'] && !board[row][3] && !board[row][2] && !board[row][1]) moves.push([row,2])
      }
    }
  }
  return moves
}

function isInCheck(board, col) {
  // Find king
  let kr, kc
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (board[r][c]===col+'K') { kr=r; kc=c }
  if (kr===undefined) return false
  const opp = col==='w'?'b':'w'
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    if (color(board[r][c])===opp) {
      const moves = getMoves(board,r,c,null,null)
      if (moves.some(([mr,mc])=>mr===kr&&mc===kc)) return true
    }
  }
  return false
}

function applyMove(board, fr, fc, tr, tc, enPassant) {
  const nb = board.map(row=>[...row])
  nb[tr][tc] = nb[fr][fc]
  nb[fr][fc] = null
  // En passant capture
  if (type(nb[tr][tc])==='P' && enPassant && tr===enPassant[0] && tc===enPassant[1]) {
    nb[fr][tc] = null
  }
  return nb
}

function getLegalMoves(board, r, c, enPassant, castling) {
  const col = color(board[r][c])
  const raw = getMoves(board, r, c, enPassant, castling)
  return raw.filter(([tr,tc]) => {
    const nb = applyMove(board, r, c, tr, tc, enPassant)
    // Handle castling rook
    if (type(board[r][c])==='K' && Math.abs(tc-c)===2) {
      if (isInCheck(board, col)) return false
      // Check passing square
      const mid = tc>c ? c+1 : c-1
      const nm  = applyMove(board,r,c,r,mid,null)
      if (isInCheck(nm, col)) return false
    }
    return !isInCheck(nb, col)
  })
}

// Simple AI — picks best move by material
const VALUES = {P:1,N:3,B:3,R:5,Q:9,K:100}
function aiMove(board, enPassant, castling) {
  let best = null, bestScore = -Infinity
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    if (color(board[r][c])!=='b') continue
    const moves = getLegalMoves(board,r,c,enPassant,castling)
    for (const [tr,tc] of moves) {
      const nb  = applyMove(board,r,c,tr,tc,enPassant)
      let score = 0
      if (board[tr][tc]) score += VALUES[type(board[tr][tc])] || 0
      // Positional bonus — prefer center
      score += (3.5-Math.abs(tr-3.5))*0.1 + (3.5-Math.abs(tc-3.5))*0.1
      // Random tiebreak
      score += Math.random()*0.2
      if (score > bestScore) { bestScore=score; best={r,c,tr,tc} }
    }
  }
  return best
}

export default function Chess({ onScore, onGameOver }) {
  const [board,      setBoard]      = useState(INIT_BOARD.map(r=>[...r]))
  const [selected,   setSelected]   = useState(null)
  const [legalMoves, setLegalMoves] = useState([])
  const [turn,       setTurn]       = useState('w')
  const [enPassant,  setEnPassant]  = useState(null)
  const [castling,   setCastling]   = useState({wK:true,wQ:true,bK:true,bQ:true})
  const [status,     setStatus]     = useState('Your turn (White)')
  const [captured,   setCaptured]   = useState({w:[],b:[]})
  const [gameOver,   setGameOver]   = useState(false)
  const [promotion,  setPromotion]  = useState(null) // {r,c,col}

  function handleClick(r, c) {
    if (gameOver || turn !== 'w' || promotion) return
    const piece = board[r][c]

    if (selected) {
      const [sr, sc] = selected
      const isLegal  = legalMoves.some(([mr,mc])=>mr===r&&mc===c)

      if (isLegal) {
        makeMove(board, sr, sc, r, c)
      } else if (piece && color(piece)==='w') {
        const moves = getLegalMoves(board, r, c, enPassant, castling)
        setSelected([r,c]); setLegalMoves(moves)
      } else {
        setSelected(null); setLegalMoves([])
      }
    } else {
      if (piece && color(piece)==='w') {
        const moves = getLegalMoves(board, r, c, enPassant, castling)
        setSelected([r,c]); setLegalMoves(moves)
      }
    }
  }

  function makeMove(b, fr, fc, tr, tc, isAI=false) {
    const nb  = applyMove(b, fr, fc, tr, tc, enPassant)
    const col = color(b[fr][fc])
    const opp = col==='w'?'b':'w'

    // Capture tracking
    const cap = {...captured}
    if (b[tr][tc]) cap[col] = [...cap[col], b[tr][tc]]
    if (type(b[fr][fc])==='P' && enPassant && tr===enPassant[0] && tc===enPassant[1]) {
      cap[col] = [...cap[col], opp+'P']
      nb[fr][tc] = null
    }
    setCaptured(cap)

    // Castling rook
    if (type(b[fr][fc])==='K' && Math.abs(tc-fc)===2) {
      const row = fr
      if (tc===6) { nb[row][5]=nb[row][7]; nb[row][7]=null }
      else        { nb[row][3]=nb[row][0]; nb[row][0]=null }
    }

    // Update castling rights
    const nc = {...castling}
    if (fr===7&&fc===4||fr===7&&fc===0) nc.wQ=false
    if (fr===7&&fc===4||fr===7&&fc===7) nc.wK=false
    if (fr===0&&fc===4||fr===0&&fc===0) nc.bQ=false
    if (fr===0&&fc===4||fr===0&&fc===7) nc.bK=false
    setCastling(nc)

    // En passant
    const ep = (type(b[fr][fc])==='P' && Math.abs(tr-fr)===2)
      ? [fr+(tr-fr)/2, fc] : null
    setEnPassant(ep)

    // Pawn promotion
    if (type(b[fr][fc])==='P' && (tr===0||tr===7)) {
      nb[tr][tc] = col+'Q' // auto-promote to queen
    }

    setBoard(nb)
    setSelected(null); setLegalMoves([])

    // Check game state
    const nextTurn = opp
    const inCheck  = isInCheck(nb, nextTurn)
    let hasAny     = false
    for (let r=0;r<8&&!hasAny;r++) for (let c=0;c<8&&!hasAny;c++) {
      if (color(nb[r][c])===nextTurn && getLegalMoves(nb,r,c,ep,nc).length>0) hasAny=true
    }

    if (!hasAny) {
      const msg = inCheck ? `Checkmate! ${col==='w'?'White':'Black'} wins!` : 'Stalemate! Draw.'
      setStatus(msg); setGameOver(true); onGameOver(0); return
    }

    if (isAI) {
      setTurn('w')
      setStatus(inCheck ? 'Check! Your turn (White)' : 'Your turn (White)')
    } else {
      setTurn('b')
      setStatus(inCheck ? 'Check! AI thinking...' : 'AI thinking...')
      // AI move
      setTimeout(() => {
        const move = aiMove(nb, ep, nc)
        if (move) makeMove(nb, move.r, move.c, move.tr, move.tc, true)
        else { setStatus('Stalemate! Draw.'); setGameOver(true) }
      }, 400)
    }
  }

  function reset() {
    setBoard(INIT_BOARD.map(r=>[...r]))
    setSelected(null); setLegalMoves([])
    setTurn('w'); setEnPassant(null)
    setCastling({wK:true,wQ:true,bK:true,bQ:true})
    setStatus('Your turn (White)')
    setCaptured({w:[],b:[]}); setGameOver(false); setPromotion(null)
  }

  const SQ = 38
  const boardSize = SQ * 8

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',userSelect:'none'}}>
      <style>{`
        .chess-wrap { display:flex; flex-direction:column; align-items:center; gap:8px; }
        .chess-status {
          font-family:var(--mono); font-size:11px; letter-spacing:0.1em;
          color:var(--accent); text-transform:uppercase; padding:4px 12px;
          border:1px solid rgba(0,255,200,0.2); background:rgba(0,255,200,0.05);
        }
        .chess-captured { font-size:13px; min-height:18px; }
        .chess-board {
          border:2px solid rgba(0,255,200,0.3);
          box-shadow:0 0 20px rgba(0,255,200,0.1);
          cursor:pointer;
        }
        .chess-btn {
          font-family:var(--mono); font-size:10px; letter-spacing:0.12em;
          text-transform:uppercase; padding:6px 16px;
          border:1px solid var(--accent); background:transparent;
          color:var(--accent); cursor:pointer; transition:all 0.15s;
        }
        .chess-btn:hover { background:rgba(0,255,200,0.08); }
      `}</style>

      <div className="chess-wrap">
        <div className="chess-status">{status}</div>

        {/* Black captured */}
        <div className="chess-captured" style={{color:'rgba(0,255,200,0.5)'}}>
          {captured.b.map(p=>PIECES[p]).join(' ')}
        </div>

        {/* Board */}
        <svg
          className="chess-board"
          width={boardSize}
          height={boardSize}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const c = Math.floor((e.clientX - rect.left) / SQ)
            const r = Math.floor((e.clientY - rect.top)  / SQ)
            if (inBounds(r,c)) handleClick(r,c)
          }}>

          {/* Squares */}
          {Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>{
            const light    = (r+c)%2===0
            const isSelected = selected && selected[0]===r && selected[1]===c
            const isLegal  = legalMoves.some(([mr,mc])=>mr===r&&mc===c)
            const isCapture= isLegal && board[r][c]
            let fill = light ? '#1a2535' : '#0d1520'
            if (isSelected) fill = 'rgba(0,255,200,0.25)'
            return (
              <g key={`${r}-${c}`}>
                <rect x={c*SQ} y={r*SQ} width={SQ} height={SQ} fill={fill}/>
                {/* Legal move dot */}
                {isLegal && !isCapture && (
                  <circle cx={c*SQ+SQ/2} cy={r*SQ+SQ/2} r={7}
                    fill="rgba(0,255,200,0.35)"/>
                )}
                {/* Capture highlight */}
                {isCapture && (
                  <rect x={c*SQ} y={r*SQ} width={SQ} height={SQ}
                    fill="rgba(255,0,60,0.2)" stroke="rgba(255,0,60,0.5)" strokeWidth={2}/>
                )}
              </g>
            )
          }))}

          {/* Coordinates */}
          {Array.from({length:8},(_,i)=>(
            <g key={`coord-${i}`}>
              <text x={2} y={i*SQ+13} fill="rgba(0,255,200,0.25)" fontSize={9} fontFamily="monospace">
                {8-i}
              </text>
              <text x={i*SQ+SQ-10} y={boardSize-2} fill="rgba(0,255,200,0.25)" fontSize={9} fontFamily="monospace">
                {String.fromCharCode(97+i)}
              </text>
            </g>
          ))}

          {/* Pieces */}
          {board.map((row,r)=>row.map((piece,c)=>piece ? (
            <text
              key={`${r}-${c}-${piece}`}
              x={c*SQ+SQ/2} y={r*SQ+SQ/2+11}
              textAnchor="middle"
              fontSize={30}
              fill={color(piece)==='w' ? '#e0f0ff' : '#1a3a5a'}
              stroke={color(piece)==='w' ? 'rgba(0,255,200,0.4)' : 'rgba(0,200,255,0.6)'}
              strokeWidth={0.5}
              style={{filter: selected&&selected[0]===r&&selected[1]===c
                ? 'drop-shadow(0 0 6px #00ffc8)' : 'none', pointerEvents:'none'}}
            >
              {PIECES[piece]}
            </text>
          ) : null))}
        </svg>

        {/* White captured */}
        <div className="chess-captured" style={{color:'rgba(255,100,100,0.7)'}}>
          {captured.w.map(p=>PIECES[p]).join(' ')}
        </div>

        <button className="chess-btn" onClick={reset}>New game</button>
      </div>
    </div>
  )
}
