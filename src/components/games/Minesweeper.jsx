import { useEffect, useRef } from 'react'

const COLS=16, ROWS=16, MINES=99
const SQ=16, OX=2, OY=48

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

// Score = base 10000 minus time penalty. Faster = higher score.
function calcScore(elapsedSec) {
  return Math.max(100, 10000 - Math.floor(elapsedSec) * 30)
}

function fmtTime(sec) {
  const m = Math.floor(sec/60)
  const s = Math.floor(sec%60)
  return m>0 ? `${m}m ${s}s` : `${s}s`
}

export default function Minesweeper({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')

    let board    = null
    let flags    = 0
    let revealed = 0
    let dead     = false
    let won      = false
    let startTime= null   // Date.now() when first click
    let elapsed  = 0      // seconds since start
    let timerRef = null

    function getElapsed() {
      if(!startTime) return 0
      return (Date.now() - startTime) / 1000
    }

    function startTimer() {
      startTime = Date.now()
      timerRef  = setInterval(() => {
        if(dead || won) { clearInterval(timerRef); return }
        elapsed = getElapsed()
        draw()
      }, 500)
    }

    function stopTimer() {
      clearInterval(timerRef)
      elapsed = getElapsed()
    }

    function reset() {
      board=null; flags=0; revealed=0; dead=false; won=false
      startTime=null; elapsed=0
      clearInterval(timerRef); timerRef=null
      draw()
    }

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,280,320)

      // Header
      ctx.fillStyle='rgba(0,255,200,0.7)'; ctx.font='bold 11px monospace'
      ctx.textAlign='left';  ctx.fillText(`💣 ${MINES-flags}`, 6, 18)
      // Timer
      ctx.textAlign='center'
      ctx.fillStyle='rgba(255,204,0,0.8)'; ctx.font='bold 11px monospace'
      ctx.fillText(board && !dead && !won ? `⏱ ${fmtTime(elapsed)}` : board ? `⏱ ${fmtTime(elapsed)}` : '⏱ 0s', 140, 18)
      // Score
      ctx.textAlign='right'
      ctx.fillStyle='rgba(0,255,200,0.6)'; ctx.font='11px monospace'
      const sc = startTime ? calcScore(elapsed) : 10000
      ctx.fillText(`Score: ${sc}`, 274, 18)

      // Status line
      ctx.fillStyle='rgba(0,255,200,0.3)'; ctx.font='9px monospace'; ctx.textAlign='center'
      if(dead)      ctx.fillText('💥 BOOM! Click to restart', 140, 34)
      else if(won)  ctx.fillText(`✓ Cleared in ${fmtTime(elapsed)}! Click to restart`, 140, 34)
      else if(!board) ctx.fillText('Click any cell to start — 99 mines!', 140, 34)
      else          ctx.fillText('Right-click to flag a mine', 140, 34)

      // Separator line
      ctx.strokeStyle='rgba(0,255,200,0.15)'; ctx.lineWidth=0.5
      ctx.beginPath(); ctx.moveTo(0,40); ctx.lineTo(280,40); ctx.stroke()

      // Empty grid before first click
      if(!board) {
        for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
          ctx.fillStyle='#0d1825'; ctx.strokeStyle='rgba(0,255,200,0.1)'; ctx.lineWidth=0.5
          ctx.fillRect(OX+c*SQ, OY+r*SQ, SQ, SQ)
          ctx.strokeRect(OX+c*SQ, OY+r*SQ, SQ, SQ)
        }
        return
      }

      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
        const cell = board[r][c]
        const x = OX+c*SQ, y = OY+r*SQ

        if(cell.revealed) {
          ctx.fillStyle = cell.mine ? '#1a0010' : '#0a1520'
          ctx.fillRect(x,y,SQ,SQ)
          ctx.strokeStyle='rgba(0,255,200,0.04)'; ctx.lineWidth=0.5; ctx.strokeRect(x,y,SQ,SQ)
          if(cell.mine) {
            ctx.font='10px monospace'; ctx.textAlign='center'; ctx.fillText('💣',x+SQ/2,y+SQ/2+4)
          } else if(cell.count > 0) {
            ctx.fillStyle=NC[cell.count]; ctx.font='bold 9px monospace'
            ctx.textAlign='center'; ctx.fillText(cell.count, x+SQ/2, y+SQ/2+3)
          }
        } else {
          ctx.fillStyle = cell.flagged ? '#1a1200' : '#0d1825'
          ctx.strokeStyle='rgba(0,255,200,0.15)'; ctx.lineWidth=0.5
          ctx.fillRect(x,y,SQ,SQ); ctx.strokeRect(x,y,SQ,SQ)
          if(cell.flagged) {
            ctx.font='9px monospace'; ctx.textAlign='center'; ctx.fillText('🚩',x+SQ/2,y+SQ/2+3)
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
      if(dead||won) { reset(); return }
      const [r,c] = getRC(e)
      if(r<0||r>=ROWS||c<0||c>=COLS) return

      if(!board) {
        board = makeBoard(r,c)
        startTimer()
      }

      const cell = board[r][c]
      if(cell.revealed||cell.flagged) return

      if(cell.mine) {
        board.forEach(row=>row.forEach(cl=>{ if(cl.mine) cl.revealed=true }))
        dead=true
        stopTimer()
        onGameOver(0)
      } else {
        flood(board,r,c)
        revealed = board.flat().filter(cl=>cl.revealed&&!cl.mine).length
        const sc = calcScore(getElapsed())
        onScore(sc)
        if(revealed === ROWS*COLS-MINES) {
          won=true
          stopTimer()
          const finalScore = calcScore(elapsed)
          onWin(finalScore)
        }
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
      clearInterval(timerRef)
      ref.current?.removeEventListener('click', onClick)
      ref.current?.removeEventListener('contextmenu', onRightClick)
    }
  }, [])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
