import { useEffect, useRef } from 'react'

// Whack-a-Mole — 3x3 grid, click the moles before they hide
export default function Whack({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    const HOLES = [
      {x:56, y:90}, {x:140,y:90}, {x:224,y:90},
      {x:56, y:180},{x:140,y:180},{x:224,y:180},
      {x:56, y:265},{x:140,y:265},{x:224,y:265},
    ]
    const R = 34 // hole radius
    let moles    = Array(9).fill(0)   // 0=hidden, >0=visible countdown
    let score    = 0
    let timeLeft = 30
    let alive    = true
    let combo    = 0
    let flashes  = [] // {x,y,t,hit}

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,280,320)

      // Title
      ctx.fillStyle='rgba(0,255,200,0.5)'; ctx.font='bold 11px monospace'
      ctx.textAlign='center'; ctx.fillText('WHACK-A-MOLE',140,20)

      // HUD
      ctx.fillStyle='rgba(0,255,200,0.7)'; ctx.font='bold 13px monospace'
      ctx.textAlign='left';  ctx.fillText(`Score: ${score}`, 10, 40)
      ctx.textAlign='right'; ctx.fillText(`${timeLeft}s`, 270, 40)
      if(combo>1){
        ctx.fillStyle='#ffcc00'; ctx.font='bold 10px monospace'
        ctx.textAlign='center'; ctx.fillText(`COMBO x${combo}!`,140,40)
      }

      // Holes + moles
      HOLES.forEach((h,i) => {
        // Hole shadow
        ctx.fillStyle='rgba(0,0,0,0.6)'
        ctx.beginPath(); ctx.ellipse(h.x,h.y+8,R,R*0.35,0,0,Math.PI*2); ctx.fill()

        // Hole
        ctx.fillStyle='#060d14'
        ctx.strokeStyle='rgba(0,255,200,0.15)'; ctx.lineWidth=1.5
        ctx.beginPath(); ctx.ellipse(h.x,h.y,R,R*0.55,0,0,Math.PI*2)
        ctx.fill(); ctx.stroke()

        // Mole
        if(moles[i] > 0) {
          const t   = moles[i]
          const rise= Math.min(1, t/3)
          const cy  = h.y - rise*18

          // Body
          ctx.fillStyle='#bf00ff'
          ctx.shadowColor='#bf00ff'; ctx.shadowBlur=10
          ctx.beginPath(); ctx.ellipse(h.x, cy, R*0.6, R*0.7*rise, 0, 0, Math.PI*2)
          ctx.fill(); ctx.shadowBlur=0

          // Eyes
          if(rise > 0.5) {
            ctx.fillStyle='#fff'
            ctx.beginPath(); ctx.arc(h.x-10, cy-8, 6, 0, Math.PI*2); ctx.fill()
            ctx.beginPath(); ctx.arc(h.x+10, cy-8, 6, 0, Math.PI*2); ctx.fill()
            ctx.fillStyle='#03050a'
            ctx.beginPath(); ctx.arc(h.x-10, cy-8, 3, 0, Math.PI*2); ctx.fill()
            ctx.beginPath(); ctx.arc(h.x+10, cy-8, 3, 0, Math.PI*2); ctx.fill()
            // Nose
            ctx.fillStyle='#ffcc00'
            ctx.beginPath(); ctx.arc(h.x, cy-2, 4, 0, Math.PI*2); ctx.fill()
          }
        }
      })

      // Hit flashes
      flashes = flashes.filter(f => f.t > 0)
      flashes.forEach(f => {
        ctx.fillStyle = f.hit
          ? `rgba(0,255,200,${f.t/8})`
          : `rgba(255,0,60,${f.t/8})`
        ctx.font = 'bold 14px monospace'; ctx.textAlign='center'
        ctx.fillText(f.hit ? `+${f.pts}` : 'MISS', f.x, f.y)
        f.t--
      })

      // Timer bar
      const pct = timeLeft / 30
      ctx.fillStyle='rgba(0,255,200,0.1)'; ctx.fillRect(10,305,260,8)
      ctx.fillStyle=pct>0.4?'#00ffc8':pct>0.2?'#ffcc00':'#ff003c'
      ctx.fillRect(10,305,260*pct,8)

      if(!alive) {
        ctx.fillStyle='rgba(3,5,10,0.85)'; ctx.fillRect(0,0,280,320)
        ctx.fillStyle='#00ffc8'; ctx.font='bold 18px monospace'; ctx.textAlign='center'
        ctx.fillText('TIME\'S UP!',140,140)
        ctx.fillStyle='rgba(0,255,200,0.6)'; ctx.font='13px monospace'
        ctx.fillText(`Final Score: ${score}`,140,168)
      }
    }

    // Mole spawn logic
    let spawnTimer = 0
    const gameLoop = setInterval(() => {
      if(!alive) return
      spawnTimer++

      // Countdown active moles
      moles = moles.map(m => Math.max(0, m-1))

      // Spawn new mole every ~1.2s, faster as time goes on
      const interval = Math.max(4, 8 - Math.floor((30-timeLeft)/8))
      if(spawnTimer >= interval) {
        spawnTimer = 0
        const empty = moles.map((m,i)=>m===0?i:-1).filter(i=>i>=0)
        if(empty.length > 0) {
          const idx = empty[Math.floor(Math.random()*empty.length)]
          moles[idx] = 6 + Math.floor(Math.random()*4)
        }
      }
      draw()
    }, 150)

    // Countdown timer
    const timerLoop = setInterval(() => {
      if(!alive) return
      timeLeft--
      if(timeLeft <= 0) {
        alive = false
        clearInterval(gameLoop)
        clearInterval(timerLoop)
        onGameOver(score)
      }
    }, 1000)

    function onClick(e) {
      if(!alive) return
      const rect = ref.current.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      let hit = false
      HOLES.forEach((h,i) => {
        const dx=mx-h.x, dy=my-h.y
        if(Math.sqrt(dx*dx+dy*dy) < R+5 && moles[i] > 0) {
          combo++
          const pts = combo > 2 ? 20 : 10
          score += pts; onScore(score)
          moles[i] = 0
          flashes.push({x:h.x, y:h.y-30, t:8, hit:true, pts})
          hit = true
        }
      })
      if(!hit) { combo=0; flashes.push({x:mx,y:my,t:6,hit:false,pts:0}) }
      draw()
    }

    ref.current.addEventListener('click', onClick)
    draw()
    return () => {
      clearInterval(gameLoop); clearInterval(timerLoop)
      ref.current?.removeEventListener('click', onClick)
    }
  }, [])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'crosshair'}}/>
}
