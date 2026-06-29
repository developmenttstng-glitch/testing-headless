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

function fmtTime(sec) {
  const m = Math.floor(sec/60)
  const s = Math.floor(sec%60)
  return m>0 ? `${m}m ${s}s` : `${s}s`
}

// Time bonus added on top of accumulated score
// Faster finish = bigger bonus
function timeBonus(elapsedSec) {
  if(elapsedSec <= 30)  return 5000
  if(elapsedSec <= 60)  return 3000
  if(elapsedSec <= 120) return 2000
  if(elapsedSec <= 180) return 1000
  if(elapsedSec <= 300) return 500
  return 100
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
    let score    = 0
    let startTime= null
    let elapsed  = 0
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
      }, 1000)
    }

    function stopTimer() {
      clearInterval(timerRef)
      elapsed = getElapsed()
    }

    function reset() {
      board=null; flags=0; revealed=0; dead=false; won=false; score=0
      startTime=null; elapsed=0
      clearInterval(timerRef); timerRef=null
      draw()
    }

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,280,320)

      // Header row 1 — mines left + timer
      ctx.font='bold 11px monospace'; ctx.textAlign='left'
      ctx.fillStyle='rgba(0,255,200,0.8)'
      ctx.fillText(`💣 ${MINES-flags}`, 6, 18)

      ctx.textAlign='center'
      ctx.fillStyle='rgba(255,204,0,0.85)'
      ctx.fillText(startTime ? `⏱ ${fmtTime(elapsed)}` : '⏱ 0s', 140, 18)

      ctx.textAlign='right'
      ctx.fillStyle='rgba(0,255,200,0.7)'
      ctx.fillText(`Score: ${score}`, 274, 18)

      // Status line
      ctx.font='9px monospace'; ctx.textAlign='center'
      ctx.fillStyle='rgba(0,255,200,0.35)'
      if(dead)       ctx.fillText('💥 BOOM! Click to restart', 140, 34)
      else if(won)   ctx.fillText(`✓ Done in ${fmtTime(elapsed)}! Click to restart`, 140, 34)
      else if(!board) ctx.fillText('Click to start — 99 mines!', 140, 34)
      else           ctx.fillText('Right-click to flag', 140, 34)

      // Separator
      ctx.strokeStyle='rgba(0,255,200,0.12)'; ctx.lineWidth=0.5
      ctx.beginPath(); ctx.moveTo(0,40); ctx.lineTo(280,40); ctx.stroke()

      // Empty grid before first click
      if(!board) {
        for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
          ctx.fillStyle='#141e2e'
          ctx.strokeStyle='rgba(0,255,200,0.12)'; ctx.lineWidth=0.5
          ctx.fillRect(OX+c*SQ, OY+r*SQ, SQ, SQ)
          ctx.strokeRect(OX+c*SQ, OY+r*SQ, SQ, SQ)
        }
        return
      }

      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
        const cell = board[r][c]
        const x = OX+c*SQ, y = OY+r*SQ

        if(cell.revealed) {
          if(cell.mine) {
            // Exploded mine — red tint
            ctx.fillStyle='#2a0018'
            ctx.fillRect(x,y,SQ,SQ)
            ctx.strokeStyle='rgba(255,0,60,0.3)'; ctx.lineWidth=0.5; ctx.strokeRect(x,y,SQ,SQ)
            ctx.font='10px monospace'; ctx.textAlign='center'
            ctx.fillText('💣',x+SQ/2,y+SQ/2+4)
          } else {
            // Revealed safe cell — clearly lighter than unrevealed
            ctx.fillStyle='#1e3a50'
            ctx.fillRect(x,y,SQ,SQ)
            // Subtle inner highlight to show it's pressed/revealed
            ctx.fillStyle='rgba(0,255,200,0.04)'
            ctx.fillRect(x+1,y+1,SQ-2,SQ-2)
            ctx.strokeStyle='rgba(0,255,200,0.08)'; ctx.lineWidth=0.5; ctx.strokeRect(x,y,SQ,SQ)
            if(cell.count > 0) {
              ctx.fillStyle=NC[cell.count]
              ctx.font='bold 9px monospace'; ctx.textAlign='center'
              ctx.fillText(cell.count, x+SQ/2, y+SQ/2+3)
            }
          }
        } else {
          // Unrevealed — dark, clearly distinct from revealed
          ctx.fillStyle= cell.flagged ? '#1e1800' : '#0d1825'
          ctx.strokeStyle='rgba(0,255,200,0.18)'; ctx.lineWidth=0.5
          ctx.fillRect(x,y,SQ,SQ); ctx.strokeRect(x,y,SQ,SQ)
          // Slight bevel effect on top-left edges to look raised
          ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=0.5
          ctx.beginPath(); ctx.moveTo(x,y+SQ); ctx.lineTo(x,y); ctx.lineTo(x+SQ,y); ctx.stroke()
          if(cell.flagged) {
            ctx.font='9px monospace'; ctx.textAlign='center'
            ctx.fillText('🚩',x+SQ/2,y+SQ/2+3)
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
        dead=true; stopTimer(); onGameOver(score)
      } else {
        flood(board,r,c)
        revealed = board.flat().filter(cl=>cl.revealed&&!cl.mine).length
        // Accumulate score — same as before
        score = revealed * 10
        onScore(score)
        if(revealed === ROWS*COLS-MINES) {
          won=true; stopTimer()
          // Add time bonus on top of accumulated score
          const bonus = timeBonus(elapsed)
          score = score + bonus
          onWin(score)
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
