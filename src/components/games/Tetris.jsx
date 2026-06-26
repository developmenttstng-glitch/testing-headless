import { useEffect, useRef } from 'react'

const W=10,H=20,S=14
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
  const pc = Math.floor(Math.random()*PIECES.length)
  return { pc, piece: PIECES[pc].map(r=>[...r]) }
}

export default function Tetris({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')

    // Board area: x=0..139, y=0..319 (10 cols * 14px)
    // Preview area: x=144..195, y=0..60
    const BOARD_W = W * S        // 140
    const TOTAL_W = BOARD_W + 56 // 196 — extra panel on right

    const state = {
      board: Array.from({length:H},()=>Array(W).fill(0)),
      px:0, py:0, pc:0, piece:null,
      nextPc:0, nextPiece:null,
      score:0, level:1, lines:0, falling:true,
    }

    function spawnNext() {
      // current becomes next
      state.pc = state.nextPc
      state.piece = state.nextPiece ? state.nextPiece.map(r=>[...r]) : PIECES[state.pc].map(r=>[...r])
      state.px = Math.floor((W - state.piece[0].length)/2)
      state.py = 0
      // generate new next
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

    function hardDrop() {
      while(valid(state.piece,state.px,state.py+1)) state.py++
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
    }

    // Ghost piece (shadow)
    function ghostY() {
      let gy = state.py
      while(valid(state.piece,state.px,gy+1)) gy++
      return gy
    }

    function draw() {
      ctx.fillStyle='#03050a'
      ctx.fillRect(0,0,TOTAL_W,H*S)

      // Grid lines
      ctx.strokeStyle='rgba(0,255,200,0.04)';ctx.lineWidth=0.5
      for(let r=0;r<H;r++) for(let c=0;c<W;c++) ctx.strokeRect(c*S,r*S,S,S)

      // Board cells
      state.board.forEach((row,r)=>row.forEach((v,c)=>{
        if(!v) return
        const col=COLORS[v-1]
        ctx.fillStyle=col; ctx.fillRect(c*S+1,r*S+1,S-2,S-2)
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(c*S+1,r*S+1,S-2,3)
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(c*S+1,r*S+S-4,S-2,3)
      }))

      // Ghost piece
      if(state.piece) {
        const gy=ghostY()
        ctx.fillStyle='rgba(0,255,200,0.12)'
        state.piece.forEach((row,r)=>row.forEach((v,c)=>{
          if(v) ctx.fillRect((state.px+c)*S+1,(gy+r)*S+1,S-2,S-2)
        }))
      }

      // Active piece
      if(state.piece) {
        ctx.fillStyle=COLORS[state.pc]
        state.piece.forEach((row,r)=>row.forEach((v,c)=>{
          if(!v) return
          ctx.fillRect((state.px+c)*S+1,(state.py+r)*S+1,S-2,S-2)
          ctx.fillStyle='rgba(255,255,255,0.2)'
          ctx.fillRect((state.px+c)*S+1,(state.py+r)*S+1,S-2,3)
          ctx.fillStyle=COLORS[state.pc]
        }))
      }

      // Divider
      ctx.strokeStyle='rgba(0,255,200,0.15)';ctx.lineWidth=1
      ctx.beginPath();ctx.moveTo(BOARD_W+2,0);ctx.lineTo(BOARD_W+2,H*S);ctx.stroke()

      // NEXT PIECE panel
      const px=BOARD_W+6, py=4
      ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='7px monospace'
      ctx.textAlign='left';ctx.fillText('NEXT',px,py+8)

      if(state.nextPiece) {
        const ns=10
        const np=state.nextPiece
        const offX=px+(Math.floor((4-np[0].length)/2)*ns)
        const offY=py+14
        ctx.fillStyle=COLORS[state.nextPc]
        np.forEach((row,r)=>row.forEach((v,c)=>{
          if(v) {
            ctx.fillRect(offX+c*ns+1,offY+r*ns+1,ns-2,ns-2)
            ctx.fillStyle='rgba(255,255,255,0.15)'
            ctx.fillRect(offX+c*ns+1,offY+r*ns+1,ns-2,2)
            ctx.fillStyle=COLORS[state.nextPc]
          }
        }))
      }

      // Score & level in panel
      ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='7px monospace';ctx.textAlign='left'
      ctx.fillText('SCORE',px,py+72)
      ctx.fillStyle='#00ffc8';ctx.font='bold 9px monospace'
      ctx.fillText(state.score,px,py+83)
      ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='7px monospace'
      ctx.fillText('LEVEL',px,py+98)
      ctx.fillStyle='#00ffc8';ctx.font='bold 9px monospace'
      ctx.fillText(state.level,px,py+109)
      ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='7px monospace'
      ctx.fillText('LINES',px,py+124)
      ctx.fillStyle='#00ffc8';ctx.font='bold 9px monospace'
      ctx.fillText(state.lines,px,py+135)

      // Controls hint
      ctx.fillStyle='rgba(0,255,200,0.2)';ctx.font='6px monospace'
      ctx.fillText('↑ rotate',px,H*S-60)
      ctx.fillText('↓ soft drop',px,H*S-50)
      ctx.fillText('↕ hard drop',px,H*S-40)
      ctx.fillText('← → move',px,H*S-30)
      ctx.fillText('SPC pause',px,H*S-20)
    }

    // Init
    const n = randomPiece()
    state.nextPc = n.pc; state.nextPiece = n.piece
    spawnNext(); draw()

    const loop = setInterval(()=>{
      if(!state.falling||!state.piece) return
      if(valid(state.piece,state.px,state.py+1)) state.py++
      else {
        place()
        if(!valid(PIECES[state.nextPc],Math.floor((W-PIECES[state.nextPc][0].length)/2),0,)){
          clearInterval(loop); onGameOver(state.score); return
        }
        spawnNext()
      }
      draw()
    }, Math.max(80,480-state.level*38))

    function onKey(e) {
      // Prevent page scroll for game keys
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault()
      }
      if(!state.piece) return
      if(e.key==='ArrowLeft' && valid(state.piece,state.px-1,state.py)) state.px--
      else if(e.key==='ArrowRight' && valid(state.piece,state.px+1,state.py)) state.px++
      else if(e.key==='ArrowDown') {
        // Soft drop — move down one row fast
        if(valid(state.piece,state.px,state.py+1)) state.py++
        else { place(); spawnNext() }
      }
      else if(e.key==='ArrowUp') {
        // Rotate
        const rot=state.piece[0].map((_,i)=>state.piece.map(r=>r[i]).reverse())
        if(valid(rot,state.px,state.py)) state.piece=rot
      }
      else if(e.key==='Enter') {
        // Hard drop — slam to bottom
        hardDrop()
        place(); spawnNext()
      }
      else if(e.key===' ') state.falling=!state.falling
      draw()
    }
    window.addEventListener('keydown',onKey)
    return()=>{ clearInterval(loop); window.removeEventListener('keydown',onKey) }
  },[])

  return (
    <canvas ref={ref} width={196} height={280}
      style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px'}}/>
  )
}
