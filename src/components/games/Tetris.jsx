import { useEffect, useRef } from 'react'

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
const PIECE_NAMES=['I','O','S','Z','J','L','T']

function randomPiece() {
  const pc = Math.floor(Math.random() * PIECES.length)
  return { pc, piece: PIECES[pc].map(r => [...r]) }
}

export default function Tetris({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx    = canvas.getContext('2d')

    // Layout:
    // Left panel  (hold): 0..55
    // Board:             56..215  (W*S = 160px, offset ox=56)
    // Right panel (next): 216..279
    const PANEL  = 56
    const OX     = PANEL
    const OY     = 4
    const TOTAL_W= PANEL + W*S + PANEL   // 56+160+56 = 272
    const TOTAL_H= H*S + OY*2            // 328

    canvas.width  = TOTAL_W
    canvas.height = TOTAL_H

    const state = {
      board:    Array.from({length:H}, ()=>Array(W).fill(0)),
      px:0, py:0, pc:0, piece:null,
      nextPc:0, nextPiece:null,
      holdPc:-1, holdPiece:null,   // -1 = no hold yet
      canHold: true,               // reset to true after each piece placement
      score:0, level:1, lines:0,
      paused:false, dead:false,
    }

    let loopRef = null

    // ── Helpers ──────────────────────────────────────────────────────────────
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
      // generate new next
      const n = randomPiece()
      state.nextPc    = n.pc
      state.nextPiece = n.piece
      return ok
    }

    // ── HOLD ─────────────────────────────────────────────────────────────────
    function holdPiece() {
      if(!state.canHold || state.dead || state.paused) return

      if(state.holdPc === -1) {
        // No hold yet — store current, spawn next
        state.holdPc    = state.pc
        state.holdPiece = PIECES[state.pc].map(r=>[...r])
        state.canHold   = false
        spawnNext()
      } else {
        // Swap current with hold
        const swapPc    = state.holdPc
        const swapPiece = PIECES[swapPc].map(r=>[...r])
        state.holdPc    = state.pc
        state.holdPiece = PIECES[state.pc].map(r=>[...r])
        state.canHold   = false
        spawnPiece(swapPc, swapPiece)
      }
      draw()
    }

    // ── Place & clear ─────────────────────────────────────────────────────────
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
      state.canHold = true   // allow hold again after placing
      onScore(state.score, state.level)
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
    }

    // ── Draw ─────────────────────────────────────────────────────────────────
    function drawMiniPiece(ctx, piece, pc, cx, cy, cellSize=11) {
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
      // Background
      ctx.fillStyle='#03050a'
      ctx.fillRect(0, 0, TOTAL_W, TOTAL_H)

      // ── LEFT PANEL — HOLD ────────────────────────────────────────────────
      ctx.fillStyle='rgba(0,255,200,0.25)'
      ctx.font='7px monospace'
      ctx.textAlign='center'
      ctx.letterSpacing='1px'
      ctx.fillText('HOLD', PANEL/2, 16)

      // Hold box
      ctx.strokeStyle='rgba(0,255,200,0.12)'
      ctx.lineWidth=1
      ctx.strokeRect(8, 22, PANEL-16, 52)

      if(state.holdPc !== -1) {
        // Dim if can't hold
        ctx.globalAlpha = state.canHold ? 1 : 0.35
        drawMiniPiece(ctx, state.holdPiece, state.holdPc, PANEL/2, 48)
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle='rgba(0,255,200,0.08)'
        ctx.font='9px monospace'
        ctx.textAlign='center'
        ctx.fillText('—', PANEL/2, 50)
      }

      // Can't hold indicator
      if(!state.canHold && state.holdPc !== -1) {
        ctx.fillStyle='rgba(255,0,60,0.5)'
        ctx.font='7px monospace'
        ctx.textAlign='center'
        ctx.fillText('used', PANEL/2, 82)
      }

      // Hold key hint
      ctx.fillStyle='rgba(0,255,200,0.18)'
      ctx.font='7px monospace'
      ctx.textAlign='center'
      ctx.fillText('TAB to hold', PANEL/2, TOTAL_H-20)

      // ── BOARD ─────────────────────────────────────────────────────────────
      // Grid
      ctx.strokeStyle='rgba(0,255,200,0.04)'
      ctx.lineWidth=0.5
      for(let r=0;r<H;r++) for(let c=0;c<W;c++)
        ctx.strokeRect(OX+c*S, OY+r*S, S, S)

      // Board cells
      state.board.forEach((row,r)=>row.forEach((v,c)=>{
        if(!v) return
        ctx.fillStyle=COLORS[v-1]
        ctx.fillRect(OX+c*S+1, OY+r*S+1, S-2, S-2)
        ctx.fillStyle='rgba(255,255,255,0.15)'
        ctx.fillRect(OX+c*S+1, OY+r*S+1, S-2, 3)
        ctx.fillStyle='rgba(0,0,0,0.18)'
        ctx.fillRect(OX+c*S+1, OY+r*S+S-4, S-2, 3)
      }))

      // Ghost piece
      if(state.piece) {
        const gy = ghostY()
        ctx.fillStyle='rgba(0,255,200,0.08)'
        state.piece.forEach((row,r)=>row.forEach((v,c)=>{
          if(v) ctx.fillRect(OX+(state.px+c)*S+1, OY+(gy+r)*S+1, S-2, S-2)
        }))
        // Ghost border
        ctx.strokeStyle='rgba(0,255,200,0.2)'
        ctx.lineWidth=0.5
        state.piece.forEach((row,r)=>row.forEach((v,c)=>{
          if(v) ctx.strokeRect(OX+(state.px+c)*S+1, OY+(gy+r)*S+1, S-2, S-2)
        }))
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

      // ── RIGHT PANEL — NEXT + STATS ───────────────────────────────────────
      const RX = OX + W*S  // right panel x start

      ctx.fillStyle='rgba(0,255,200,0.25)'
      ctx.font='7px monospace'
      ctx.textAlign='center'
      ctx.fillText('NEXT', RX+PANEL/2, 16)

      // Next box
      ctx.strokeStyle='rgba(0,255,200,0.12)'
      ctx.lineWidth=1
      ctx.strokeRect(RX+8, 22, PANEL-16, 52)

      drawMiniPiece(ctx, state.nextPiece, state.nextPc, RX+PANEL/2, 48)

      // Stats
      const stats=[['SCORE',state.score],['LEVEL',state.level],['LINES',state.lines]]
      stats.forEach(([lbl,val],i)=>{
        const y = 92+i*40
        ctx.fillStyle='rgba(0,255,200,0.28)'
        ctx.font='7px monospace'
        ctx.textAlign='center'
        ctx.fillText(lbl, RX+PANEL/2, y)
        ctx.fillStyle='#00ffc8'
        ctx.font='bold 12px monospace'
        ctx.textAlign='center'
        ctx.fillText(val, RX+PANEL/2, y+14)
      })

      // Controls hints
      const hints=[
        ['↑','rotate'],['↓','soft'],
        ['SPC','drop'],['TAB','hold'],
        ['P','pause'],
      ]
      hints.forEach(([key,lbl],i)=>{
        ctx.fillStyle='rgba(0,255,200,0.2)'
        ctx.font='6px monospace'
        ctx.textAlign='left'
        ctx.fillText(`${key}  ${lbl}`, RX+10, TOTAL_H-70+i*13)
      })

      // Paused overlay
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

    // ── Init ─────────────────────────────────────────────────────────────────
    const n = randomPiece()
    state.nextPc = n.pc; state.nextPiece = n.piece
    spawnNext()
    draw()
    restartLoop()

    // ── Keys ─────────────────────────────────────────────────────────────────
    function onKey(e) {
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab'].includes(e.key)){
        e.preventDefault()
      }
      if(state.dead) return
      if(e.key==='p'||e.key==='P'){
        state.paused=!state.paused; draw(); return
      }
      if(state.paused||!state.piece) return

      if(e.key==='ArrowLeft' && valid(state.piece,state.px-1,state.py)) { state.px--; draw() }
      else if(e.key==='ArrowRight' && valid(state.piece,state.px+1,state.py)) { state.px++; draw() }
      else if(e.key==='ArrowDown') {
        if(valid(state.piece,state.px,state.py+1)) { state.py++; draw() }
        else { place(); spawnNext(); draw() }
      }
      else if(e.key==='ArrowUp') {
        const rot = state.piece[0].map((_,i)=>state.piece.map(r=>r[i]).reverse())
        if(valid(rot,state.px,state.py))           { state.piece=rot; draw() }
        else if(valid(rot,state.px-1,state.py))    { state.piece=rot; state.px--; draw() }
        else if(valid(rot,state.px+1,state.py))    { state.piece=rot; state.px++; draw() }
      }
      else if(e.key===' ') { hardDrop(); draw() }
      else if(e.key==='Tab') { holdPiece() }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      clearInterval(loopRef)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{
        display: 'block',
        border: '1px solid rgba(0,255,200,0.15)',
        borderRadius: '2px',
      }}
    />
  )
}
