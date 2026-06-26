import { useEffect, useRef, useCallback } from 'react'

const SIZE = 4
const COLORS = {
  0:    ['#0a1520', '#0a1520'],
  2:    ['#0d2535', '#4fc3f7'],
  4:    ['#0d3525', '#00ffc8'],
  8:    ['#1a2535', '#00c8ff'],
  16:   ['#1a0035', '#bf00ff'],
  32:   ['#1a0020', '#ff003c'],
  64:   ['#1a1000', '#ffcc00'],
  128:  ['#001a10', '#00ff66'],
  256:  ['#100010', '#ff66ff'],
  512:  ['#001020', '#00ffff'],
  1024: ['#200010', '#ff6600'],
  2048: ['#200000', '#ffffff'],
}

function emptyGrid() { return Array.from({length:SIZE}, ()=>Array(SIZE).fill(0)) }
function addRandom(g) {
  const empty=[]
  g.forEach((row,r)=>row.forEach((v,c)=>{ if(!v) empty.push([r,c]) }))
  if(!empty.length) return g
  const [r,c]=empty[Math.floor(Math.random()*empty.length)]
  const ng=g.map(row=>[...row])
  ng[r][c]=Math.random()<0.9?2:4
  return ng
}
function slideRow(row) {
  let r=row.filter(v=>v)
  let score=0
  for(let i=0;i<r.length-1;i++){
    if(r[i]===r[i+1]){ r[i]*=2; score+=r[i]; r.splice(i+1,1); i++ }
  }
  while(r.length<SIZE) r.push(0)
  return {row:r,score}
}
function moveGrid(g,dir) {
  let ng=g.map(row=>[...row])
  let totalScore=0
  if(dir==='left'||dir==='right'){
    ng=ng.map(row=>{
      const r=dir==='right'?[...row].reverse():row
      const {row:sr,score}=slideRow(r)
      totalScore+=score
      return dir==='right'?sr.reverse():sr
    })
  } else {
    for(let c=0;c<SIZE;c++){
      let col=ng.map(r=>r[c])
      if(dir==='down') col.reverse()
      const {row:sc,score}=slideRow(col)
      totalScore+=score
      if(dir==='down') sc.reverse()
      ng.forEach((r,i)=>r[c]=sc[i])
    }
  }
  return {grid:ng,score:totalScore}
}
function gridsEqual(a,b) {
  return a.every((row,r)=>row.every((v,c)=>v===b[r][c]))
}
function hasWon(g) { return g.some(row=>row.some(v=>v>=2048)) }
function hasLost(g) {
  if(g.some(row=>row.some(v=>!v))) return false
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    const v=g[r][c]
    if(c<SIZE-1&&g[r][c+1]===v) return false
    if(r<SIZE-1&&g[r+1][c]===v) return false
  }
  return true
}

export default function Game2048({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)
  const stateRef = useRef({ grid: addRandom(addRandom(emptyGrid())), score: 0, alive: true })

  const draw = useCallback(() => {
    const canvas = ref.current
    if(!canvas) return
    const ctx = canvas.getContext('2d')
    const { grid, score } = stateRef.current
    const S = 60, PAD = 6, OX = 10, OY = 44

    ctx.fillStyle = '#03050a'
    ctx.fillRect(0, 0, 280, 320)

    ctx.fillStyle = 'rgba(0,255,200,0.4)'
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('2048', 10, 22)
    ctx.fillStyle = 'rgba(0,255,200,0.3)'
    ctx.font = '9px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`SCORE: ${score}`, 270, 22)

    for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
      const v = grid[r][c]
      const x = OX + c*(S+PAD)
      const y = OY + r*(S+PAD)
      const [bg, fg] = COLORS[Math.min(v, 2048)] || COLORS[2048]

      ctx.fillStyle = bg
      ctx.beginPath()
      ctx.roundRect(x, y, S, S, 4)
      ctx.fill()

      if(v > 0) {
        ctx.fillStyle = fg
        const fs = v < 100 ? 20 : v < 1000 ? 16 : 12
        ctx.font = `bold ${fs}px monospace`
        ctx.textAlign = 'center'
        ctx.fillText(v, x + S/2, y + S/2 + fs*0.35)
      }
    }
  }, [])

  useEffect(() => {
    draw()

    function onKey(e) {
      const dirs = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down' }
      const dir = dirs[e.key]
      if(!dir) return
      e.preventDefault()
      const st = stateRef.current
      if(!st.alive) return
      const { grid: ng, score: gained } = moveGrid(st.grid, dir)
      if(gridsEqual(ng, st.grid)) return
      const newGrid = addRandom(ng)
      const newScore = st.score + gained
      stateRef.current = { ...st, grid: newGrid, score: newScore }
      onScore(newScore)
      draw()
      if(hasWon(newGrid)) { st.alive=false; onWin(newScore) }
      else if(hasLost(newGrid)) { st.alive=false; onGameOver(newScore) }
    }

    // Touch swipe support
    let tx0=0, ty0=0
    function onTouchStart(e) { tx0=e.touches[0].clientX; ty0=e.touches[0].clientY }
    function onTouchEnd(e) {
      const dx=e.changedTouches[0].clientX-tx0
      const dy=e.changedTouches[0].clientY-ty0
      if(Math.abs(dx)>Math.abs(dy)) onKey({key:dx>0?'ArrowRight':'ArrowLeft',preventDefault:()=>{}})
      else onKey({key:dy>0?'ArrowDown':'ArrowUp',preventDefault:()=>{}})
    }

    window.addEventListener('keydown', onKey)
    ref.current?.addEventListener('touchstart', onTouchStart)
    ref.current?.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <canvas ref={ref} width={280} height={320}
      style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',touchAction:'none'}}/>
  )
}
