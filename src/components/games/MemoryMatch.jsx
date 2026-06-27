import { useEffect, useRef } from 'react'

const CW=280, CH=320
const COLS=4, ROWS=4, PAD=6
const SQ=Math.floor((CW-PAD*(COLS+1))/COLS) // =58
const TOP=32

const ICONS=['◈','◆','▲','●','★','♦','♥','♠']
const COLORS=['#00ffc8','#bf00ff','#ff003c','#ffcc00','#00c8ff','#ff6600','#00ff66','#ff66ff']

export default function MemoryMatch({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')

    function makeDeck() {
      const deck = [...ICONS, ...ICONS]
      for(let i=deck.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [deck[i],deck[j]]=[deck[j],deck[i]]
      }
      return deck.map((icon,i)=>({ id:i, icon, flipped:false, matched:false }))
    }

    let cards=makeDeck(), flipped=[], matched=0, moves=0, locked=false, score=0, done=false

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,CW,CH)

      // Header
      ctx.fillStyle='rgba(0,255,200,0.6)'; ctx.font='10px monospace'
      ctx.textAlign='left';  ctx.fillText(`Moves: ${moves}`, 6, 16)
      ctx.textAlign='right'; ctx.fillText(`Pairs: ${matched/2}/${ICONS.length}`, CW-6, 16)
      ctx.fillStyle='rgba(0,255,200,0.2)'; ctx.font='9px monospace'
      ctx.textAlign='center'; ctx.fillText('Click to flip · match all pairs', CW/2, 28)

      cards.forEach((card,i) => {
        const col=i%COLS, row=Math.floor(i/COLS)
        const x=PAD+col*(SQ+PAD), y=TOP+PAD+row*(SQ+PAD)
        const show=card.flipped||card.matched
        const ci=ICONS.indexOf(card.icon)
        const c=COLORS[ci]

        ctx.fillStyle=card.matched?`${c}18`:show?'#0d1520':'#0a1520'
        ctx.strokeStyle=card.matched?`${c}55`:show?c:'rgba(0,255,200,0.2)'
        ctx.lineWidth=show?1.5:0.8
        ctx.beginPath(); ctx.roundRect(x,y,SQ,SQ,4); ctx.fill(); ctx.stroke()

        if(show) {
          ctx.shadowColor=c; ctx.shadowBlur=card.matched?8:4
          ctx.fillStyle=card.matched?`${c}88`:c
          ctx.font='bold 24px monospace'; ctx.textAlign='center'
          ctx.fillText(card.icon, x+SQ/2, y+SQ/2+9)
          ctx.shadowBlur=0
        } else {
          ctx.fillStyle='rgba(0,255,200,0.07)'
          ctx.font='18px monospace'; ctx.textAlign='center'
          ctx.fillText('◈', x+SQ/2, y+SQ/2+6)
        }
      })

      if(done) {
        ctx.fillStyle='rgba(3,5,10,0.88)'; ctx.fillRect(0,0,CW,CH)
        ctx.fillStyle='#00ffc8'; ctx.font='bold 16px monospace'; ctx.textAlign='center'
        ctx.fillText('All matched!', CW/2, CH/2-12)
        ctx.fillStyle='rgba(0,255,200,0.5)'; ctx.font='11px monospace'
        ctx.fillText(`${moves} moves · Score: ${score}`, CW/2, CH/2+10)
        ctx.fillStyle='rgba(0,255,200,0.3)'; ctx.font='10px monospace'
        ctx.fillText('Click to play again', CW/2, CH/2+30)
      }
    }

    function reset() {
      cards=makeDeck(); flipped=[]; matched=0; moves=0; locked=false; score=0; done=false
      draw()
    }

    function onClick(e) {
      if(locked) return
      if(done) { reset(); return }
      const rect=ref.current.getBoundingClientRect()
      const mx=e.clientX-rect.left, my=e.clientY-rect.top-TOP-PAD
      const col=Math.floor((mx-PAD)/(SQ+PAD))
      const row=Math.floor(my/(SQ+PAD))
      const idx=row*COLS+col
      if(col<0||col>=COLS||row<0||row>=ROWS||idx<0||idx>=cards.length) return
      const card=cards[idx]
      if(card.flipped||card.matched||flipped.includes(idx)) return
      card.flipped=true; flipped=[...flipped,idx]; draw()
      if(flipped.length===2) {
        moves++; locked=true
        const [a,b]=flipped
        if(cards[a].icon===cards[b].icon) {
          cards[a].matched=cards[b].matched=true
          matched+=2; flipped=[]; locked=false
          score+=Math.max(10,50-moves); onScore(score)
          if(matched===cards.length) { done=true; onWin(score) }
          draw()
        } else {
          setTimeout(()=>{ cards[a].flipped=cards[b].flipped=false; flipped=[]; locked=false; draw() }, 800)
        }
      }
    }

    draw()
    ref.current.addEventListener('click', onClick)
    return () => ref.current?.removeEventListener('click', onClick)
  }, [])

  return <canvas ref={ref} width={CW} height={CH}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
