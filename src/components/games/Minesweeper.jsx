import { useState, useEffect, useRef } from 'react'

const COLS=10, ROWS=10, MINES=15
const SQ=26, BW=COLS*SQ, BH=ROWS*SQ

function makeBoard(firstR, firstC) {
  const cells = Array.from({length:ROWS},(_,r)=>
    Array.from({length:COLS},(_,c)=>({mine:false,revealed:false,flagged:false,count:0}))
  )
  // Place mines avoiding first click area
  let placed=0
  while(placed<MINES){
    const r=Math.floor(Math.random()*ROWS)
    const c=Math.floor(Math.random()*COLS)
    if(!cells[r][c].mine&&!(Math.abs(r-firstR)<=1&&Math.abs(c-firstC)<=1)){
      cells[r][c].mine=true; placed++
    }
  }
  // Count neighbors
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
    if(cells[r][c].mine) continue
    let cnt=0
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
      const nr=r+dr,nc=c+dc
      if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&cells[nr][nc].mine) cnt++
    }
    cells[r][c].count=cnt
  }
  return cells
}

function flood(cells, r, c){
  if(r<0||r>=ROWS||c<0||c>=COLS) return
  if(cells[r][c].revealed||cells[r][c].flagged||cells[r][c].mine) return
  cells[r][c].revealed=true
  if(cells[r][c].count===0)
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) flood(cells,r+dr,c+dc)
}

const NUM_COLORS=['','#00ffc8','#00c8ff','#ff003c','#bf00ff','#ff6600','#ffcc00','#00ff66','#ffffff']

export default function Minesweeper({ onScore, onGameOver, onWin }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({
    cells: null, started:false, dead:false, won:false,
    flags:0, revealed:0, score:0
  })
  const [,rerender] = useState(0)

  function draw(){
    const canvas=canvasRef.current; if(!canvas) return
    const ctx=canvas.getContext('2d')
    const s=stateRef.current

    ctx.fillStyle='#03050a'; ctx.fillRect(0,0,BW,BH+36)

    // Header
    ctx.fillStyle='rgba(0,255,200,0.5)'; ctx.font='11px monospace'; ctx.textAlign='left'
    ctx.fillText(`💣 ${MINES-s.flags}`,8,22)
    ctx.textAlign='right'
    ctx.fillText(s.dead?'💥 Game Over':s.won?'🎉 You Win!':'Click to reveal',BW-8,22)

    if(!s.cells){
      // Empty grid before first click
      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
        ctx.fillStyle='#0d1825'
        ctx.strokeStyle='rgba(0,255,200,0.15)'; ctx.lineWidth=0.5
        ctx.fillRect(c*SQ,r*SQ+36,SQ,SQ)
        ctx.strokeRect(c*SQ,r*SQ+36,SQ,SQ)
      }
      ctx.fillStyle='rgba(0,255,200,0.4)'; ctx.font='11px monospace'; ctx.textAlign='center'
      ctx.fillText('Click anywhere to start',BW/2,BH/2+36)
      return
    }

    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      const cell=s.cells[r][c]
      const x=c*SQ, y=r*SQ+36

      if(cell.revealed){
        ctx.fillStyle=cell.mine?'#1a0010':'#0a1520'
        ctx.fillRect(x,y,SQ,SQ)
        ctx.strokeStyle='rgba(0,255,200,0.06)'; ctx.lineWidth=0.5; ctx.strokeRect(x,y,SQ,SQ)
        if(cell.mine){
          ctx.fillStyle='#ff003c'; ctx.font='14px monospace'; ctx.textAlign='center'
          ctx.fillText('💣',x+SQ/2,y+SQ/2+5)
        } else if(cell.count>0){
          ctx.fillStyle=NUM_COLORS[cell.count]; ctx.font='bold 13px monospace'; ctx.textAlign='center'
          ctx.fillText(cell.count,x+SQ/2,y+SQ/2+5)
        }
      } else {
        ctx.fillStyle=cell.flagged?'#1a1000':'#0d1825'
        ctx.strokeStyle='rgba(0,255,200,0.2)'; ctx.lineWidth=0.5
        ctx.fillRect(x,y,SQ,SQ); ctx.strokeRect(x,y,SQ,SQ)
        if(cell.flagged){
          ctx.fillStyle='#ffcc00'; ctx.font='12px monospace'; ctx.textAlign='center'
          ctx.fillText('🚩',x+SQ/2,y+SQ/2+5)
        }
      }
    }
  }

  useEffect(()=>{ draw() })

  function handleClick(e){
    const s=stateRef.current
    if(s.dead||s.won) return
    const rect=canvasRef.current.getBoundingClientRect()
    const mx=e.clientX-rect.left
    const my=e.clientY-rect.top-36
    const c=Math.floor(mx/SQ), r=Math.floor(my/SQ)
    if(r<0||r>=ROWS||c<0||c>=COLS) return

    if(!s.cells){
      s.cells=makeBoard(r,c)
      s.started=true
    }

    const cell=s.cells[r][c]
    if(cell.revealed||cell.flagged) return

    if(cell.mine){
      // Reveal all mines
      s.cells.forEach(row=>row.forEach(cl=>{ if(cl.mine) cl.revealed=true }))
      cell.revealed=true; s.dead=true
      onGameOver(s.score)
    } else {
      flood(s.cells,r,c)
      s.revealed=s.cells.flat().filter(cl=>cl.revealed&&!cl.mine).length
      s.score=s.revealed*10
      onScore(s.score)
      if(s.revealed===ROWS*COLS-MINES){ s.won=true; onWin(s.score) }
    }
    draw(); rerender(n=>n+1)
  }

  function handleRightClick(e){
    e.preventDefault()
    const s=stateRef.current
    if(!s.cells||s.dead||s.won) return
    const rect=canvasRef.current.getBoundingClientRect()
    const c=Math.floor((e.clientX-rect.left)/SQ)
    const r=Math.floor((e.clientY-rect.top-36)/SQ)
    if(r<0||r>=ROWS||c<0||c>=COLS) return
    const cell=s.cells[r][c]
    if(cell.revealed) return
    cell.flagged=!cell.flagged
    s.flags=s.cells.flat().filter(cl=>cl.flagged).length
    draw(); rerender(n=>n+1)
  }

  function reset(){
    stateRef.current={cells:null,started:false,dead:false,won:false,flags:0,revealed:0,score:0}
    rerender(n=>n+1)
  }

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
      <canvas ref={canvasRef} width={BW} height={BH+36}
        style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'4px',cursor:'pointer'}}
        onClick={handleClick} onContextMenu={handleRightClick}/>
      <div style={{fontFamily:'var(--mono)',fontSize:'10px',color:'var(--muted)',textAlign:'center'}}>
        Left click = reveal · Right click = flag
      </div>
      <button onClick={reset} style={{fontFamily:'var(--mono)',fontSize:'10px',letterSpacing:'0.12em',
        textTransform:'uppercase',padding:'6px 16px',border:'1px solid var(--accent)',
        background:'transparent',color:'var(--accent)',cursor:'pointer'}}>
        New game
      </button>
    </div>
  )
}
