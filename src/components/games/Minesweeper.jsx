import { useEffect, useRef } from 'react'

const COLS=10, ROWS=10, MINES=15
const SQ=26, OX=3, OY=42

function makeBoard(fr, fc) {
  const b = Array.from({length:ROWS}, ()=>
    Array.from({length:COLS}, ()=>({mine:false, revealed:false, flagged:false, count:0})))
  let placed = 0
  while(placed < MINES) {
    const r=Math.floor(Math.random()*ROWS), c=Math.floor(Math.random()*COLS)
    if(!b[r][c].mine && !(Math.abs(r-fr)<=1 && Math.abs(c-fc)<=1)) {
      b[r][c].mine=true; placed++
    }
  }
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
    if(b[r][c].mine) continue
    let n=0
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) {
      const nr=r+dr, nc=c+dc
      if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&b[nr][nc].mine) n++
    }
    b[r][c].count = n
  }
  return b
}

function flood(b, r, c) {
  if(r<0||r>=ROWS||c<0||c>=COLS) return
  if(b[r][c].revealed||b[r][c].flagged||b[r][c].mine) return
  b[r][c].revealed = true
  if(b[r][c].count === 0)
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) flood(b,r+dr,c+dc)
}

const NC = ['','#00ffc8','#00c8ff','#ff003c','#bf00ff','#ff6600','#ffcc00','#00ff66','#fff']

export default function Minesweeper({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')

    let board    = null
    let flags    = 0
    let revealed = 0
    let dead     = false
    let won      = false
    let score    = 0

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,280,320)

      // Header
      ctx.fillStyle='rgba(0,255,200,0.6)'; ctx.font='11px monospace'
      ctx.textAlign='left';  ctx.fillText(`💣 ${MINES-flags}`, 8, 20)
      ctx.textAlign='right'; ctx.fillText(`Score: ${score}`, 272, 20)
      ctx.fillStyle='rgba(0,255,200,0.3)'; ctx.font='9px monospace'
      ctx.textAlign='center'
      ctx.fillText(dead?'💥 Click to restart':won?'✓ You won! Click to restart':'Right-click to flag', 140, 35)

      // Empty grid before first click
      if(!board) {
        for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
          ctx.fillStyle='#0d1825'; ctx.strokeStyle='rgba(0,255,200,0.12)'; ctx.lineWidth=0.5
          ctx.fillRect(OX+c*SQ, OY+r*SQ, SQ, SQ)
          ctx.strokeRect(OX+c*SQ, OY+r*SQ, SQ, SQ)
        }
        ctx.fillStyle='rgba(0,255,200,0.4)'; ctx.font='11px monospace'; ctx.textAlign='center'
        ctx.fillText('Click to start', 140, 180)
        return
      }

      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
        const cell = board[r][c]
        const x = OX+c*SQ, y = OY+r*SQ

        if(cell.revealed) {
          ctx.fillStyle = cell.mine ? '#1a0010' : '#0a1520'
          ctx.fillRect(x,y,SQ,SQ)
          ctx.strokeStyle='rgba(0,255,200,0.05)'; ctx.lineWidth=0.5; ctx.strokeRect(x,y,SQ,SQ)
          if(cell.mine) {
            ctx.font='13px monospace'; ctx.textAlign='center'; ctx.fillText('💣',x+SQ/2,y+SQ/2+5)
          } else if(cell.count > 0) {
            ctx.fillStyle=NC[cell.count]; ctx.font='bold 11px monospace'
            ctx.textAlign='center'; ctx.fillText(cell.count, x+SQ/2, y+SQ/2+4)
          }
        } else {
          ctx.fillStyle = cell.flagged ? '#1a1200' : '#0d1825'
          ctx.strokeStyle='rgba(0,255,200,0.2)'; ctx.lineWidth=0.5
          ctx.fillRect(x,y,SQ,SQ); ctx.strokeRect(x,y,SQ,SQ)
          if(cell.flagged) {
            ctx.font='12px monospace'; ctx.textAlign='center'; ctx.fillText('🚩',x+SQ/2,y+SQ/2+4)
          }
        }
      }
    }

    function getRC(e) {
      const rect = ref.current.getBoundingClientRect()
      const c = Math.floor((e.clientX-rect.left-OX) / SQ)
      const r = Math.floor((e.clientY-rect.top-OY)  / SQ)
      return [r, c]
    }

    function onClick(e) {
      if(dead||won) { board=null; flags=0; revealed=0; dead=false; won=false; score=0; draw(); return }
      const [r,c] = getRC(e)
      if(r<0||r>=ROWS||c<0||c>=COLS) return
      if(!board) { board=makeBoard(r,c) }
      const cell = board[r][c]
      if(cell.revealed||cell.flagged) return

      if(cell.mine) {
        board.forEach(row=>row.forEach(cl=>{ if(cl.mine) cl.revealed=true }))
        dead=true; onGameOver(score)
      } else {
        flood(board,r,c)
        revealed = board.flat().filter(cl=>cl.revealed&&!cl.mine).length
        score    = revealed * 10; onScore(score)
        if(revealed === ROWS*COLS-MINES) { won=true; onWin(score) }
      }
      draw()
    }

    function onRightClick(e) {
      e.preventDefault()
      if(!board||dead||won) return
      const [r,c] = getRC(e)
      if(r<0||r>=ROWS||c<0||c>=COLS) return
      const cell = board[r][c]
      if(cell.revealed) return
      cell.flagged = !cell.flagged
      flags = board.flat().filter(cl=>cl.flagged).length
      draw()
    }

    draw()
    ref.current.addEventListener('click', onClick)
    ref.current.addEventListener('contextmenu', onRightClick)
    return () => {
      ref.current?.removeEventListener('click', onClick)
      ref.current?.removeEventListener('contextmenu', onRightClick)
    }
  }, [])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
