import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://mmbslafosnxbysifyfjb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tYnNsYWZvc254YnlzaWZ5ZmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzE5NTYsImV4cCI6MjA5ODE0Nzk1Nn0.IkV0g-8R86bKMRSjO-XDQwblIOZDItVVFjLKDPNng7g'
)

const W=10, H=20, S=16
const COLORS=['#00ffc8','#bf00ff','#ff003c','#00c8ff','#ffcc00','#ff6600','#00ff66']
const PIECES=[
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,0],[0,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[0,1,0],[1,1,1]],
]

function randomPiece() {
  const pc = Math.floor(Math.random() * PIECES.length)
  return { pc, piece: PIECES[pc].map(r => [...r]) }
}

function generateRoomId() {
  return Math.random().toString(36).substring(2,8).toUpperCase()
}

// ── Single player canvas game ─────────────────────────────────────────────────
function TetrisCanvas({ onScore, onGameOver, onBoard, vsMode = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx    = canvas.getContext('2d')

    const PANEL  = 56
    const OX     = PANEL
    const OY     = 4
    const TOTAL_W= PANEL + W*S + PANEL
    const TOTAL_H= H*S + OY*2

    canvas.width  = TOTAL_W
    canvas.height = TOTAL_H

    const state = {
      board: Array.from({length:H}, ()=>Array(W).fill(0)),
      px:0, py:0, pc:0, piece:null,
      nextPc:0, nextPiece:null,
      holdPc:-1, holdPiece:null,
      canHold: true,
      score:0, level:1, lines:0,
      paused:false, dead:false,
      pendingGarbage: 0,
    }

    let loopRef = null

    function valid(p, x, y) {
      for(let r=0;r<p.length;r++)
        for(let c=0;c<p[r].length;c++)
          if(p[r][c]){
            if(x+c<0||x+c>=W||y+r>=H) return false
            if(y+r>=0&&state.board[y+r][x+c]) return false
          }
      return true
    }

    function ghostY() {
      let gy = state.py
      while(valid(state.piece, state.px, gy+1)) gy++
      return gy
    }

    function spawnPiece(pc, piece) {
      state.pc    = pc
      state.piece = piece.map(r => [...r])
      state.px    = Math.floor((W - state.piece[0].length) / 2)
      state.py    = 0
      if(!valid(state.piece, state.px, state.py)) {
        state.dead = true
        if(loopRef) clearInterval(loopRef)
        onGameOver(state.score)
        return false
      }
      return true
    }

    function spawnNext() {
      const ok = spawnPiece(state.nextPc, state.nextPiece)
      const n = randomPiece()
      state.nextPc    = n.pc
      state.nextPiece = n.piece
      return ok
    }

    function holdPiece() {
      if(!state.canHold || state.dead || state.paused) return
      if(state.holdPc === -1) {
        state.holdPc    = state.pc
        state.holdPiece = PIECES[state.pc].map(r=>[...r])
        state.canHold   = false
        spawnNext()
      } else {
        const swapPc    = state.holdPc
        const swapPiece = PIECES[swapPc].map(r=>[...r])
        state.holdPc    = state.pc
        state.holdPiece = PIECES[state.pc].map(r=>[...r])
        state.canHold   = false
        spawnPiece(swapPc, swapPiece)
      }
      draw()
    }

    function addGarbage(lines) {
      state.pendingGarbage += lines
    }
    canvas._addGarbage = addGarbage

    function applyGarbage() {
      if(state.pendingGarbage <= 0) return
      const n = Math.min(state.pendingGarbage, 4)
      state.pendingGarbage -= n
      state.board.splice(0, n)
      for(let i=0;i<n;i++) {
        const hole = Math.floor(Math.random()*W)
        const row = Array(W).fill(8)
        row[hole] = 0
        state.board.push(row)
      }
    }

    function place() {
      state.piece.forEach((row,r)=>row.forEach((v,c)=>{
        if(v&&state.py+r>=0) state.board[state.py+r][state.px+c]=state.pc+1
      }))
      let cleared=0
      state.board=state.board.filter(row=>{
        if(row.every(v=>v)){cleared++;return false} return true
      })
      while(state.board.length<H) state.board.unshift(Array(W).fill(0))
      state.lines += cleared
      state.score += [0,100,300,500,800][cleared]*state.level
      state.level  = Math.floor(state.lines/10)+1
      state.canHold = true
      onScore(state.score, state.level)

      if(vsMode && cleared >= 2) {
        const garbage = cleared === 2 ? 1 : cleared === 3 ? 2 : 4
        onBoard && onBoard(state.board, garbage)
      } else if(vsMode) {
        onBoard && onBoard(state.board, 0)
      }

      applyGarbage()
      restartLoop()
    }

    function hardDrop() {
      state.py = ghostY()
      place()
      spawnNext()
    }

    function restartLoop() {
      if(loopRef) clearInterval(loopRef)
      loopRef = setInterval(tick, Math.max(80, 500 - state.level*40))
    }

    function tick() {
      if(state.paused||state.dead||!state.piece) return
      if(valid(state.piece, state.px, state.py+1)) {
        state.py++
      } else {
        place()
        if(!spawnNext()) return
      }
      draw()
      if(vsMode) onBoard && onBoard(state.board, 0)
    }

    function drawMiniPiece(piece, pc, cx, cy, cellSize=11) {
      if(!piece) return
      const cols = piece[0].length
      const rows = piece.length
      const ox   = cx - (cols * cellSize) / 2
      const oy   = cy - (rows * cellSize) / 2
      ctx.fillStyle = COLORS[pc]
      piece.forEach((row,r)=>row.forEach((v,c)=>{
        if(!v) return
        ctx.fillRect(ox+c*cellSize+1, oy+r*cellSize+1, cellSize-2, cellSize-2)
        ctx.fillStyle='rgba(255,255,255,0.18)'
        ctx.fillRect(ox+c*cellSize+1, oy+r*cellSize+1, cellSize-2, 3)
        ctx.fillStyle=COLORS[pc]
      }))
    }

    function draw() {
      ctx.fillStyle='#03050a'
      ctx.fillRect(0, 0, TOTAL_W, TOTAL_H)

      // LEFT — HOLD
      ctx.fillStyle='rgba(0,255,200,0.25)'
      ctx.font='7px monospace'
      ctx.textAlign='center'
      ctx.fillText('HOLD', PANEL/2, 16)
      ctx.strokeStyle='rgba(0,255,200,0.12)'
      ctx.lineWidth=1
      ctx.strokeRect(8, 22, PANEL-16, 52)
      if(state.holdPc !== -1) {
        ctx.globalAlpha = state.canHold ? 1 : 0.35
        drawMiniPiece(state.holdPiece, state.holdPc, PANEL/2, 48)
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle='rgba(0,255,200,0.08)'
        ctx.font='9px monospace'
        ctx.fillText('—', PANEL/2, 50)
      }
      if(!state.canHold && state.holdPc !== -1) {
        ctx.fillStyle='rgba(255,0,60,0.5)'
        ctx.font='7px monospace'
        ctx.fillText('used', PANEL/2, 82)
      }
      ctx.fillStyle='rgba(0,255,200,0.18)'
      ctx.font='7px monospace'
      ctx.fillText('TAB hold', PANEL/2, TOTAL_H-20)

      // BOARD
      ctx.strokeStyle='rgba(0,255,200,0.04)'
      ctx.lineWidth=0.5
      for(let r=0;r<H;r++) for(let c=0;c<W;c++)
        ctx.strokeRect(OX+c*S, OY+r*S, S, S)

      state.board.forEach((row,r)=>row.forEach((v,c)=>{
        if(!v) return
        ctx.fillStyle = v === 8 ? '#444' : COLORS[v-1]
        ctx.fillRect(OX+c*S+1, OY+r*S+1, S-2, S-2)
        ctx.fillStyle='rgba(255,255,255,0.15)'
        ctx.fillRect(OX+c*S+1, OY+r*S+1, S-2, 3)
        ctx.fillStyle='rgba(0,0,0,0.18)'
        ctx.fillRect(OX+c*S+1, OY+r*S+S-4, S-2, 3)
      }))

      // Ghost
      if(state.piece) {
        const gy = ghostY()
        if(gy !== state.py) {
          const ghostColor = COLORS[state.pc]
          state.piece.forEach((row,r)=>row.forEach((v,c)=>{
            if(!v) return
            const gx  = OX+(state.px+c)*S
            const gyy = OY+(gy+r)*S
            ctx.fillStyle='rgba(255,255,255,0.12)'
            ctx.fillRect(gx+1, gyy+1, S-2, S-2)
            ctx.strokeStyle=ghostColor
            ctx.lineWidth=1.5
            ctx.globalAlpha=0.7
            ctx.strokeRect(gx+2, gyy+2, S-4, S-4)
            ctx.globalAlpha=1
            ctx.fillStyle=ghostColor
            ctx.globalAlpha=0.35
            ctx.fillRect(gx+5, gyy+5, S-10, S-10)
            ctx.globalAlpha=1
          }))
        }
      }

      // Active piece
      if(state.piece) {
        state.piece.forEach((row,r)=>row.forEach((v,c)=>{
          if(!v) return
          ctx.fillStyle=COLORS[state.pc]
          ctx.fillRect(OX+(state.px+c)*S+1, OY+(state.py+r)*S+1, S-2, S-2)
          ctx.fillStyle='rgba(255,255,255,0.2)'
          ctx.fillRect(OX+(state.px+c)*S+1, OY+(state.py+r)*S+1, S-2, 3)
        }))
      }

      // Dividers
      ctx.strokeStyle='rgba(0,255,200,0.12)'
      ctx.lineWidth=1
      ctx.beginPath()
      ctx.moveTo(OX, 0); ctx.lineTo(OX, TOTAL_H)
      ctx.moveTo(OX+W*S, 0); ctx.lineTo(OX+W*S, TOTAL_H)
      ctx.stroke()

      // RIGHT — NEXT + STATS
      const RX = OX + W*S
      ctx.fillStyle='rgba(0,255,200,0.25)'
      ctx.font='7px monospace'
      ctx.textAlign='center'
      ctx.fillText('NEXT', RX+PANEL/2, 16)
      ctx.strokeStyle='rgba(0,255,200,0.12)'
      ctx.lineWidth=1
      ctx.strokeRect(RX+8, 22, PANEL-16, 52)
      drawMiniPiece(state.nextPiece, state.nextPc, RX+PANEL/2, 48)

      const stats=[['SCORE',state.score],['LEVEL',state.level],['LINES',state.lines]]
      stats.forEach(([lbl,val],i)=>{
        const y = 92+i*40
        ctx.fillStyle='rgba(0,255,200,0.28)'
        ctx.font='7px monospace'
        ctx.textAlign='center'
        ctx.fillText(lbl, RX+PANEL/2, y)
        ctx.fillStyle='#00ffc8'
        ctx.font='bold 12px monospace'
        ctx.fillText(val, RX+PANEL/2, y+14)
      })

      if(state.pendingGarbage > 0) {
        ctx.fillStyle='rgba(255,0,60,0.8)'
        ctx.font='bold 10px monospace'
        ctx.textAlign='center'
        ctx.fillText(`+${state.pendingGarbage}⚠`, RX+PANEL/2, 185)
      }

      const hints=[['↑','rotate'],['↓','soft'],['SPC','drop'],['TAB','hold'],['P','pause']]
      hints.forEach(([key,lbl],i)=>{
        ctx.fillStyle='rgba(0,255,200,0.2)'
        ctx.font='6px monospace'
        ctx.textAlign='left'
        ctx.fillText(`${key}  ${lbl}`, RX+10, TOTAL_H-70+i*13)
      })

      if(state.paused) {
        ctx.fillStyle='rgba(3,5,10,0.8)'
        ctx.fillRect(OX, OY, W*S, H*S)
        ctx.fillStyle='#00ffc8'
        ctx.font='bold 14px monospace'
        ctx.textAlign='center'
        ctx.fillText('PAUSED', OX+W*S/2, OY+H*S/2)
        ctx.fillStyle='rgba(0,255,200,0.4)'
        ctx.font='9px monospace'
        ctx.fillText('press P to resume', OX+W*S/2, OY+H*S/2+18)
      }
    }

    const n = randomPiece()
    state.nextPc = n.pc; state.nextPiece = n.piece
    spawnNext()
    draw()
    restartLoop()

    function onKey(e) {
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab'].includes(e.key))
        e.preventDefault()
      if(state.dead) return
      if(e.key==='p'||e.key==='P'){ state.paused=!state.paused; draw(); return }
      if(state.paused||!state.piece) return
      if(e.key==='ArrowLeft' && valid(state.piece,state.px-1,state.py)) { state.px--; draw() }
      else if(e.key==='ArrowRight' && valid(state.piece,state.px+1,state.py)) { state.px++; draw() }
      else if(e.key==='ArrowDown') {
        if(valid(state.piece,state.px,state.py+1)) { state.py++; draw() }
        else { place(); spawnNext(); draw() }
      }
      else if(e.key==='ArrowUp') {
        const rot = state.piece[0].map((_,i)=>state.piece.map(r=>r[i]).reverse())
        if(valid(rot,state.px,state.py))        { state.piece=rot; draw() }
        else if(valid(rot,state.px-1,state.py)) { state.piece=rot; state.px--; draw() }
        else if(valid(rot,state.px+1,state.py)) { state.piece=rot; state.px++; draw() }
      }
      else if(e.key===' ') { hardDrop(); draw() }
      else if(e.key==='Tab') { holdPiece() }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      clearInterval(loopRef)
      window.removeEventListener('keydown', onKey)
    }
  }, [vsMode])

  return (
    <canvas ref={ref} style={{ display:'block', border:'1px solid rgba(0,255,200,0.15)', borderRadius:2 }}/>
  )
}

// ── Opponent mini board ───────────────────────────────────────────────────────
function OpponentBoard({ board, name, score, isDead }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if(!canvas || !board) return
    const ctx = canvas.getContext('2d')
    const s   = 10
    const w   = W*s, h = H*s
    canvas.width  = w
    canvas.height = h

    ctx.fillStyle = '#03050a'
    ctx.fillRect(0,0,w,h)

    ctx.strokeStyle='rgba(0,255,200,0.04)'
    ctx.lineWidth=0.5
    for(let r=0;r<H;r++) for(let c=0;c<W;c++)
      ctx.strokeRect(c*s, r*s, s, s)

    board.forEach((row,r)=>row.forEach((v,c)=>{
      if(!v) return
      ctx.fillStyle = v===8 ? '#333' : COLORS[v-1]
      ctx.fillRect(c*s+1, r*s+1, s-2, s-2)
    }))

    if(isDead) {
      ctx.fillStyle='rgba(3,5,10,0.75)'
      ctx.fillRect(0,0,w,h)
      ctx.fillStyle='#ff003c'
      ctx.font='bold 14px monospace'
      ctx.textAlign='center'
      ctx.fillText('DEAD', w/2, h/2)
    }
  }, [board, isDead])

  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:11, color:'rgba(0,255,200,0.6)', marginBottom:4, fontFamily:'monospace', letterSpacing:2 }}>
        {name || 'Opponent'}
      </div>
      <div style={{ fontSize:10, color:'rgba(0,255,200,0.35)', marginBottom:8, fontFamily:'monospace' }}>
        {score || 0} pts
      </div>
      <canvas ref={ref} style={{ display:'block', border:'1px solid rgba(0,255,200,0.1)', borderRadius:2 }}/>
    </div>
  )
}

// ── VS Modal ──────────────────────────────────────────────────────────────────
function VSModal({ onClose, onStartVS }) {
  const [mode,     setMode]     = useState(null)
  const [roomId,   setRoomId]   = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const inp = {
    width:'100%', padding:'8px 12px',
    background:'rgba(0,255,200,0.05)',
    border:'1px solid rgba(0,255,200,0.2)',
    borderRadius:3, color:'#00ffc8',
    fontFamily:'monospace', fontSize:13,
    outline:'none', marginBottom:10, boxSizing:'border-box',
  }

  function handleCreate() {
    if(!name.trim()) { setError('Enter your name'); return }
    setLoading(true)
    const id = generateRoomId()
    onStartVS({ roomId: id, password: password.trim(), name: name.trim(), isHost: true })
  }

  function handleJoin() {
    if(!name.trim()) { setError('Enter your name'); return }
    if(!roomId.trim()) { setError('Enter room ID'); return }
    setLoading(true)
    onStartVS({ roomId: roomId.trim().toUpperCase(), password: password.trim(), name: name.trim(), isHost: false })
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.88)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:9999,
    }}>
      <div style={{
        background:'#03050a', border:'1px solid rgba(0,255,200,0.25)',
        borderRadius:6, padding:28, width:300, fontFamily:'monospace',
      }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#00ffc8', marginBottom:4, letterSpacing:2 }}>⚔ VS MODE</div>
        <div style={{ fontSize:10, color:'rgba(0,255,200,0.4)', marginBottom:20, letterSpacing:1 }}>Real-time multiplayer Tetris</div>

        {!mode && (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setMode('create')} style={{
              flex:1, padding:'12px 0',
              background:'rgba(0,255,200,0.08)',
              border:'1px solid rgba(0,255,200,0.3)',
              borderRadius:3, color:'#00ffc8',
              fontFamily:'monospace', fontSize:11,
              cursor:'pointer', letterSpacing:1,
            }}>Create Room</button>
            <button onClick={() => setMode('join')} style={{
              flex:1, padding:'12px 0',
              background:'rgba(0,255,200,0.08)',
              border:'1px solid rgba(0,255,200,0.3)',
              borderRadius:3, color:'#00ffc8',
              fontFamily:'monospace', fontSize:11,
              cursor:'pointer', letterSpacing:1,
            }}>Join Room</button>
          </div>
        )}

        {mode && (
          <div>
            <div style={{ fontSize:10, color:'rgba(0,255,200,0.4)', marginBottom:14, letterSpacing:1 }}>
              {mode === 'create' ? '— CREATE ROOM —' : '— JOIN ROOM —'}
            </div>

            <label style={{ fontSize:10, color:'rgba(0,255,200,0.5)', display:'block', marginBottom:4, letterSpacing:1 }}>Your Name</label>
            <input value={name} onChange={e=>setName(e.target.value)}
              placeholder="Enter your name" style={inp} maxLength={16}/>

            {mode === 'join' && (
              <>
                <label style={{ fontSize:10, color:'rgba(0,255,200,0.5)', display:'block', marginBottom:4, letterSpacing:1 }}>Room ID</label>
                <input value={roomId} onChange={e=>setRoomId(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  style={{...inp, textTransform:'uppercase', letterSpacing:3}} maxLength={6}/>
              </>
            )}

            <label style={{ fontSize:10, color:'rgba(0,255,200,0.5)', display:'block', marginBottom:4, letterSpacing:1 }}>
              Password <span style={{color:'rgba(0,255,200,0.25)'}}>— optional</span>
            </label>
            <input value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="Leave blank for open room" type="password" style={inp}/>

            {error && <div style={{ fontSize:10, color:'#ff003c', marginBottom:10 }}>⚠ {error}</div>}

            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <button onClick={() => { setMode(null); setError('') }} style={{
                flex:1, padding:'9px 0', background:'transparent',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:3,
                color:'rgba(255,255,255,0.4)', fontFamily:'monospace',
                fontSize:10, cursor:'pointer',
              }}>Back</button>
              <button onClick={mode==='create' ? handleCreate : handleJoin}
                disabled={loading} style={{
                  flex:2, padding:'9px 0',
                  background: loading ? 'rgba(0,255,200,0.05)' : 'rgba(0,255,200,0.15)',
                  border:'1px solid rgba(0,255,200,0.4)', borderRadius:3,
                  color:'#00ffc8', fontFamily:'monospace', fontSize:11,
                  cursor: loading ? 'not-allowed' : 'pointer', letterSpacing:1,
                }}>
                {loading ? 'Connecting...' : mode==='create' ? 'Create →' : 'Join →'}
              </button>
            </div>
          </div>
        )}

        <button onClick={onClose} style={{
          width:'100%', marginTop:14, padding:'7px 0',
          background:'transparent', border:'none',
          color:'rgba(255,255,255,0.2)', fontFamily:'monospace',
          fontSize:10, cursor:'pointer', letterSpacing:1,
        }}>
          Cancel — play solo
        </button>
      </div>
    </div>
  )
}

// ── Waiting room ──────────────────────────────────────────────────────────────
function WaitingRoom({ roomId, onCancel }) {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'32px 16px', fontFamily:'monospace',
    }}>
      <div style={{ fontSize:11, color:'rgba(0,255,200,0.5)', marginBottom:14, letterSpacing:1 }}>
        Waiting for opponent{dots}
      </div>
      <div style={{ fontSize:10, color:'rgba(0,255,200,0.3)', marginBottom:6, letterSpacing:1 }}>
        Share this Room ID:
      </div>
      <div style={{
        fontSize:26, fontWeight:700, color:'#00ffc8',
        letterSpacing:8, marginBottom:20,
        padding:'10px 18px',
        border:'1px solid rgba(0,255,200,0.3)',
        borderRadius:4,
        background:'rgba(0,255,200,0.05)',
      }}>
        {roomId}
      </div>
      <button onClick={onCancel} style={{
        padding:'7px 18px', background:'transparent',
        border:'1px solid rgba(255,255,255,0.15)', borderRadius:3,
        color:'rgba(255,255,255,0.35)', fontFamily:'monospace',
        fontSize:10, cursor:'pointer',
      }}>Cancel</button>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Tetris({ onScore, onGameOver }) {
  const [vsState,  setVsState]  = useState('solo')
  const [roomInfo, setRoomInfo] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [myName,   setMyName]   = useState('')
  const [result,   setResult]   = useState(null)
  const [gameKey,  setGameKey]  = useState(0)
  const channelRef = useRef(null)
  const myCanvasRef = useRef(null)

  const connectRoom = useCallback(async ({ roomId, password, name, isHost }) => {
    setMyName(name)
    setRoomInfo({ roomId, password, isHost })

    const channel = supabase.channel(`tetris-${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: name } }
    })

    channel
      .on('presence', { event: 'join' }, ({ key }) => {
        if(key !== name) {
          setOpponent(prev => ({ ...prev, name: key, score:0, board:null, isDead:false }))
          setVsState('playing')
          setGameKey(k => k+1)
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if(key !== name) setOpponent(prev => ({ ...prev, isDead: true }))
      })
      .on('broadcast', { event: 'board' }, ({ payload }) => {
        if(payload.name !== name) {
          setOpponent(prev => ({ ...prev, board: payload.board, score: payload.score }))
          if(payload.garbage > 0 && myCanvasRef.current?._addGarbage) {
            myCanvasRef.current._addGarbage(payload.garbage)
          }
        }
      })
      .on('broadcast', { event: 'gameover' }, ({ payload }) => {
        if(payload.name !== name) {
          setOpponent(prev => ({ ...prev, isDead: true }))
          setResult('win')
          setVsState('ended')
        }
      })
      .subscribe(async status => {
        if(status === 'SUBSCRIBED') await channel.track({ name, score: 0 })
      })

    channelRef.current = channel
    setVsState(isHost ? 'waiting' : 'playing')
    if(!isHost) setGameKey(k => k+1)
  }, [])

  const broadcastBoard = useCallback((board, garbage) => {
    if(!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast', event: 'board',
      payload: { name: myName, board, score: 0, garbage }
    })
  }, [myName])

  function handleVsGameOver(score) {
    if(channelRef.current) {
      channelRef.current.send({
        type: 'broadcast', event: 'gameover',
        payload: { name: myName, score }
      })
    }
    setResult('lose')
    setVsState('ended')
    onGameOver(score)
  }

  function handleCancel() {
    channelRef.current?.unsubscribe()
    channelRef.current = null
    setVsState('solo'); setOpponent(null)
    setResult(null); setRoomInfo(null)
    setGameKey(k => k+1)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>

      {/* VS button — below canvas, full width, only in solo */}
      <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>

        {/* My board */}
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {vsState === 'playing' && (
            <div style={{
              fontSize:10, color:'rgba(0,255,200,0.5)',
              fontFamily:'monospace', marginBottom:6, letterSpacing:2, textAlign:'center',
            }}>
              YOU — {myName}
            </div>
          )}
          <TetrisCanvas
            key={gameKey}
            onScore={onScore}
            onGameOver={vsState === 'playing' ? handleVsGameOver : onGameOver}
            onBoard={vsState === 'playing' ? broadcastBoard : null}
            vsMode={vsState === 'playing'}
          />
          {/* VS button below canvas */}
          {vsState === 'solo' && (
            <button onClick={() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'P', bubbles: true })); setVsState('modal') }} style={{
              marginTop:8, padding:'7px 0', width:'100%',
              background:'rgba(0,255,200,0.06)',
              border:'1px solid rgba(0,255,200,0.25)',
              borderRadius:3, color:'#00ffc8',
              fontFamily:'monospace', fontSize:11,
              cursor:'pointer', letterSpacing:2,
              transition:'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(0,255,200,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(0,255,200,0.06)'}>
              ⚔ VS MODE
            </button>
          )}
        </div>

        {/* Opponent board */}
        {(vsState === 'playing' || vsState === 'ended') && opponent && (
          <div style={{ paddingTop:18 }}>
            <OpponentBoard
              board={opponent.board}
              name={opponent.name}
              score={opponent.score}
              isDead={opponent.isDead}
            />
          </div>
        )}

        {/* Waiting room */}
        {vsState === 'waiting' && roomInfo && (
          <WaitingRoom roomId={roomInfo.roomId} onCancel={handleCancel}/>
        )}
      </div>

      {/* Result overlay */}
      {vsState === 'ended' && result && (
        <div style={{
          position:'fixed', inset:0,
          background:'rgba(3,5,10,0.92)',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          fontFamily:'monospace', zIndex:9998,
        }}>
          <div style={{
            fontSize:30, fontWeight:900, letterSpacing:4,
            color: result==='win' ? '#00ffc8' : '#ff003c',
            marginBottom:10,
          }}>
            {result === 'win' ? '🏆 YOU WIN' : '💀 YOU LOSE'}
          </div>
          <div style={{ fontSize:11, color:'rgba(0,255,200,0.4)', marginBottom:24, letterSpacing:1 }}>
            {result === 'win' ? 'Opponent topped out!' : 'Better luck next time.'}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleCancel} style={{
              padding:'10px 22px',
              background:'rgba(0,255,200,0.12)',
              border:'1px solid rgba(0,255,200,0.4)',
              borderRadius:3, color:'#00ffc8',
              fontFamily:'monospace', fontSize:11,
              cursor:'pointer', letterSpacing:1,
            }}>Play Again</button>
            <button onClick={handleCancel} style={{
              padding:'10px 22px', background:'transparent',
              border:'1px solid rgba(255,255,255,0.1)', borderRadius:3,
              color:'rgba(255,255,255,0.3)', fontFamily:'monospace',
              fontSize:11, cursor:'pointer',
            }}>Solo Mode</button>
          </div>
        </div>
      )}

      {/* VS Modal */}
      {vsState === 'modal' && (
        <VSModal
          onClose={() => setVsState('solo')}
          onStartVS={connectRoom}
        />
      )}
    </div>
  )
}
