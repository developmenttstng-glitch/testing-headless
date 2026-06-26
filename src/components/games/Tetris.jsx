import { useEffect, useRef } from 'react'

const W=10,H=20,S=16
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
  const pc=Math.floor(Math.random()*PIECES.length)
  return { pc, piece: PIECES[pc].map(r=>[...r]) }
}

export default function Tetris({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')

    const BOARD_W = W * S        // 160
    const PANEL_W = 64
    const TOTAL_W = BOARD_W + PANEL_W  // 224
    const TOTAL_H = H * S              // 320

    const state = {
      board: Array.from({length:H},()=>Array(W).fill(0)),
      px:0, py:0, pc:0, piece:null,
      nextPc:0, nextPiece:null,
      score:0, level:1, lines:0,
      paused:false, dead:false,
    }

    let loopRef = null

    function spawnNext() {
      state.pc = state.nextPc
      state.piece = state.nextPiece
        ? state.nextPiece.map(r=>[...r])
        : PIECES[state.pc].map(r=>[...r])
      state.px = Math.floor((W - state.piece[0].length)/2)
      state.py = 0
      const n = randomPiece()
      state.nextPc = n.pc
      state.nextPiece = n.piece
    }

    function valid(p,x,y) {
      for(let r=0;r<p.length;r++)
        for(let c=0;c<p[r].length;c++)
          if(p[r][c]){
            if(x+c<0||x+c>=W||y+r>=H) return false
            if(y+r>=0&&state.board[y+r][x+c]) return false
          }
      return true
    }

    function ghostY() {
      let gy=state.py
      while(valid(state.piece,state.px,gy+1)) gy++
      return gy
    }

    function hardDrop() {
      state.py = ghostY()
      place()
      if(!checkSpawn()) return
      spawnNext()
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
      state.lines+=cleared
      state.score+=[0,100,300,500,800][cleared]*state.level
      state.level=Math.floor(state.lines/10)+1
      onScore(state.score,state.level)
      restartLoop()
    }

    function checkSpawn() {
      if(!valid(PIECES[state.nextPc],
        Math.floor((W-PIECES[state.nextPc][0].length)/2),0)){
        state.dead=true
        if(loopRef) clearInterval(loopRef)
        onGameOver(state.score)
        return false
      }
      return true
    }

    function restartLoop() {
      if(loopRef) clearInterval(loopRef)
      loopRef=setInterval(tick, Math.max(80,500-state.level*40))
    }

    function tick() {
      if(state.paused||state.dead||!state.piece) return
      if(valid(state.piece,state.px,state.py+1)) {
        state.py++
      } else {
        place()
        if(!checkSpawn()) return
        spawnNext()
      }
      draw()
    }

    function draw() {
      ctx.fillStyle='#03050a'
      ctx.fillRect(0,0,TOTAL_W,TOTAL_H)

      // Grid
      ctx.strokeStyle='rgba(0,255,200,0.04)';ctx.lineWidth=0.5
      for(let r=0;r<H;r++) for(let c=0;c<W;c++) ctx.strokeRect(c*S,r*S,S,S)

      // Board
      state.board.forEach((row,r)=>row.forEach((v,c)=>{
        if(!v) return
        ctx.fillStyle=COLORS[v-1]; ctx.fillRect(c*S+1,r*S+1,S-2,S-2)
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(c*S+1,r*S+1,S-2,3)
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(c*S+1,r*S+S-4,S-2,3)
      }))

      // Ghost
      if(state.piece) {
        const gy=ghostY()
        ctx.fillStyle='rgba(0,255,200,0.1)'
        state.piece.forEach((row,r)=>row.forEach((v,c)=>{
          if(v) ctx.fillRect((state.px+c)*S+1,(gy+r)*S+1,S-2,S-2)
        }))
      }

      // Active piece
      if(state.piece) {
        state.piece.forEach((row,r)=>row.forEach((v,c)=>{
          if(!v) return
          ctx.fillStyle=COLORS[state.pc]
          ctx.fillRect((state.px+c)*S+1,(state.py+r)*S+1,S-2,S-2)
          ctx.fillStyle='rgba(255,255,255,0.2)'
          ctx.fillRect((state.px+c)*S+1,(state.py+r)*S+1,S-2,3)
        }))
      }

      // Divider
      ctx.strokeStyle='rgba(0,255,200,0.12)';ctx.lineWidth=1
      ctx.beginPath();ctx.moveTo(BOARD_W+1,0);ctx.lineTo(BOARD_W+1,TOTAL_H);ctx.stroke()

      // PANEL
      const px=BOARD_W+8

      // NEXT label
      ctx.fillStyle='rgba(0,255,200,0.35)';ctx.font='7px monospace';ctx.textAlign='left'
      ctx.fillText('NEXT',px,14)

      // Next piece
      if(state.nextPiece) {
        const ns=11
        const np=state.nextPiece
        const ox=px+Math.floor((4-np[0].length)/2)*ns
        const oy=20
        ctx.fillStyle=COLORS[state.nextPc]
        np.forEach((row,r)=>row.forEach((v,c)=>{
          if(!v) return
          ctx.fillRect(ox+c*ns+1,oy+r*ns+1,ns-2,ns-2)
          ctx.fillStyle='rgba(255,255,255,0.15)'
          ctx.fillRect(ox+c*ns+1,oy+r*ns+1,ns-2,2)
          ctx.fillStyle=COLORS[state.nextPc]
        }))
      }

      // Stats
      const stats=[
        ['SCORE', state.score],
        ['LEVEL', state.level],
        ['LINES', state.lines],
      ]
      stats.forEach(([lbl,val],i)=>{
        const y=80+i*38
        ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='7px monospace'
        ctx.fillText(lbl,px,y)
        ctx.fillStyle='#00ffc8';ctx.font='bold 11px monospace'
        ctx.fillText(val,px,y+13)
      })

      // Controls
      ctx.fillStyle='rgba(0,255,200,0.18)';ctx.font='6px monospace'
      const hints=[
        '↑  rotate',
        '↓  soft drop',
        'SPC hard drop',
        '← → move',
        'P  pause',
      ]
      hints.forEach((h,i)=>ctx.fillText(h,px,TOTAL_H-60+i*12))

      // Paused overlay
      if(state.paused) {
        ctx.fillStyle='rgba(3,5,10,0.75)'
        ctx.fillRect(0,0,BOARD_W,TOTAL_H)
        ctx.fillStyle='#00ffc8';ctx.font='bold 14px monospace'
        ctx.textAlign='center';ctx.fillText('PAUSED',BOARD_W/2,TOTAL_H/2)
        ctx.fillStyle='rgba(0,255,200,0.4)';ctx.font='9px monospace'
        ctx.fillText('press P to resume',BOARD_W/2,TOTAL_H/2+18)
        ctx.textAlign='left'
      }
    }

    // Init
    const n=randomPiece()
    state.nextPc=n.pc; state.nextPiece=n.piece
    spawnNext(); draw()
    restartLoop()

    function onKey(e) {
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)){
        e.preventDefault()
      }
      if(state.dead) return
      if(e.key==='p'||e.key==='P'){
        state.paused=!state.paused; draw(); return
      }
      if(state.paused||!state.piece) return

      if(e.key==='ArrowLeft'&&valid(state.piece,state.px-1,state.py)) state.px--
      else if(e.key==='ArrowRight'&&valid(state.piece,state.px+1,state.py)) state.px++
      else if(e.key==='ArrowDown'){
        if(valid(state.piece,state.px,state.py+1)) state.py++
        else { place(); if(checkSpawn()) spawnNext() }
      }
      else if(e.key==='ArrowUp'){
        const rot=state.piece[0].map((_,i)=>state.piece.map(r=>r[i]).reverse())
        // Wall kick — try shifts if rotation fails
        if(valid(rot,state.px,state.py)) state.piece=rot
        else if(valid(rot,state.px-1,state.py)){ state.piece=rot; state.px-- }
        else if(valid(rot,state.px+1,state.py)){ state.piece=rot; state.px++ }
      }
      else if(e.key===' '){
        hardDrop()
      }
      draw()
    }
    window.addEventListener('keydown',onKey)
    return()=>{ clearInterval(loopRef); window.removeEventListener('keydown',onKey) }
  },[])

  return (
    <canvas ref={ref} width={224} height={320}
      style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px'}}/>
  )
}
