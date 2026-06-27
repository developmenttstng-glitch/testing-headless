import { useEffect, useRef } from 'react'

const ICONS  = ['◈','◆','▲','●','★','♦','♥','♠']
const COLORS = ['#00ffc8','#bf00ff','#ff003c','#ffcc00','#00c8ff','#ff6600','#00ff66','#ff66ff']
const COLS=4, ROWS=4, SQ=56, PAD=7
const OX=8, OY=36

export default function MemoryMatch({ onScore, onWin }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')

    // All state as plain variables
    let deck    = []
    let flipped = []   // up to 2 indices currently face-up
    let matched = 0
    let moves   = 0
    let locked  = false
    let score   = 0
    let done    = false

    function makeDeck() {
      const d = [...ICONS, ...ICONS]
      for(let i=d.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [d[i],d[j]]=[d[j],d[i]]
      }
      // Each card: { icon, flipped, matched }
      deck    = d.map(icon=>({ icon, flipped:false, matched:false }))
      flipped = []
      matched = 0
      moves   = 0
      locked  = false
      score   = 0
      done    = false
    }

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,280,320)

      ctx.fillStyle='rgba(0,255,200,0.6)'; ctx.font='10px monospace'
      ctx.textAlign='left';  ctx.fillText(`Moves: ${moves}`, 6, 18)
      ctx.textAlign='right'; ctx.fillText(`Pairs: ${matched/2}/${ICONS.length}`, 274, 18)
      ctx.fillStyle='rgba(0,255,200,0.2)'; ctx.font='9px monospace'
      ctx.textAlign='center'; ctx.fillText('Flip cards · match all pairs', 140, 30)

      for(let i=0;i<deck.length;i++) {
        const card = deck[i]
        const col  = i % COLS
        const row  = Math.floor(i / COLS)
        const x    = OX + col*(SQ+PAD)
        const y    = OY + PAD + row*(SQ+PAD)
        const show = card.flipped || card.matched
        const ci   = ICONS.indexOf(card.icon)
        const c    = COLORS[ci]

        ctx.fillStyle   = card.matched ? `${c}18` : show ? '#0d1520' : '#0a1520'
        ctx.strokeStyle = card.matched ? `${c}55` : show ? c : 'rgba(0,255,200,0.2)'
        ctx.lineWidth   = show ? 1.5 : 0.8
        ctx.beginPath(); ctx.roundRect(x,y,SQ,SQ,4); ctx.fill(); ctx.stroke()

        if(show) {
          ctx.shadowColor = c; ctx.shadowBlur = card.matched ? 8 : 4
          ctx.fillStyle   = card.matched ? `${c}88` : c
          ctx.font        = 'bold 24px monospace'; ctx.textAlign = 'center'
          ctx.fillText(card.icon, x+SQ/2, y+SQ/2+9)
          ctx.shadowBlur  = 0
        } else {
          ctx.fillStyle = 'rgba(0,255,200,0.07)'
          ctx.font      = '18px monospace'; ctx.textAlign = 'center'
          ctx.fillText('◈', x+SQ/2, y+SQ/2+6)
        }
      }

      if(done) {
        ctx.fillStyle='rgba(3,5,10,0.88)'; ctx.fillRect(0,0,280,320)
        ctx.fillStyle='#00ffc8'; ctx.font='bold 16px monospace'; ctx.textAlign='center'
        ctx.fillText('All matched!', 140, 135)
        ctx.fillStyle='rgba(0,255,200,0.5)'; ctx.font='11px monospace'
        ctx.fillText(`${moves} moves · Score: ${score}`, 140, 158)
        ctx.fillStyle='rgba(0,255,200,0.3)'; ctx.font='10px monospace'
        ctx.fillText('Click to play again', 140, 180)
      }
    }

    function onClick(e) {
      if(locked) return
      if(done) { makeDeck(); draw(); return }

      const rect = ref.current.getBoundingClientRect()
      const mx   = e.clientX - rect.left
      const my   = e.clientY - rect.top

      for(let i=0;i<deck.length;i++) {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const x   = OX + col*(SQ+PAD)
        const y   = OY + PAD + row*(SQ+PAD)
        if(mx<x||mx>x+SQ||my<y||my>y+SQ) continue
        const card = deck[i]
        if(card.flipped||card.matched) return
        if(flipped.includes(i)) return

        card.flipped = true
        flipped.push(i)
        draw()

        if(flipped.length === 2) {
          moves++
          locked = true
          const [a, b] = flipped
          if(deck[a].icon === deck[b].icon) {
            deck[a].matched = deck[b].matched = true
            matched += 2
            flipped  = []
            locked   = false
            score   += Math.max(10, 50-moves)
            onScore(score)
            if(matched === deck.length) { done=true; onWin(score) }
            draw()
          } else {
            setTimeout(() => {
              deck[a].flipped = deck[b].flipped = false
              flipped = []; locked = false; draw()
            }, 800)
          }
        }
        return
      }
    }

    makeDeck(); draw()
    ref.current.addEventListener('click', onClick)
    return () => ref.current?.removeEventListener('click', onClick)
  }, [])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
