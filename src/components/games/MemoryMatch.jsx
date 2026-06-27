import { useEffect, useRef } from 'react'

const COLS=4, ROWS=4, SQ=58, PAD=8
const BW=COLS*SQ+(COLS+1)*PAD
const BH=ROWS*SQ+(ROWS+1)*PAD+44
const ICONS=['◈','◆','▲','●','★','♦','♥','♠']
const COLORS=['#00ffc8','#bf00ff','#ff003c','#ffcc00','#00c8ff','#ff6600','#00ff66','#ff66ff']

export default function MemoryMatch({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')

    // Build shuffled deck
    function makeDeck() {
      const deck = [...ICONS, ...ICONS]
      for(let i=deck.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [deck[i],deck[j]]=[deck[j],deck[i]]
      }
      return deck.map((icon,i)=>({ id:i, icon, flipped:false, matched:false }))
    }

    let cards    = makeDeck()
    let flipped  = []   // indices of currently face-up unmatched cards
    let matched  = 0
    let moves    = 0
    let locked   = false
    let score    = 0
    let done     = false

    function draw() {
      ctx.fillStyle='#03050a'
      ctx.fillRect(0,0,BW,BH)

      // Header
      ctx.fillStyle='rgba(0,255,200,0.5)'
      ctx.font='11px monospace'
      ctx.textAlign='left'
      ctx.fillText(`Moves: ${moves}`, 8, 24)
      ctx.textAlign='right'
      ctx.fillText(`Pairs: ${matched/2}/${ICONS.length}`, BW-8, 24)

      cards.forEach((card,i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const x   = PAD + col*(SQ+PAD)
        const y   = 36 + PAD + row*(SQ+PAD)
        const show= card.flipped || card.matched
        const ci  = ICONS.indexOf(card.icon)
        const col2= COLORS[ci]

        // Background
        ctx.fillStyle = card.matched ? `${col2}18` : show ? '#0d1520' : '#0a1520'
        ctx.strokeStyle = card.matched ? `${col2}55` : show ? col2 : 'rgba(0,255,200,0.2)'
        ctx.lineWidth = show ? 1.5 : 0.8
        ctx.beginPath()
        ctx.roundRect(x,y,SQ,SQ,5)
        ctx.fill()
        ctx.stroke()

        if(show) {
          ctx.shadowColor = col2
          ctx.shadowBlur  = card.matched ? 10 : 5
          ctx.fillStyle   = card.matched ? `${col2}88` : col2
          ctx.font        = 'bold 26px monospace'
          ctx.textAlign   = 'center'
          ctx.fillText(card.icon, x+SQ/2, y+SQ/2+9)
          ctx.shadowBlur  = 0
        } else {
          ctx.fillStyle = 'rgba(0,255,200,0.08)'
          ctx.font      = '20px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('◈', x+SQ/2, y+SQ/2+7)
        }
      })

      if(done) {
        ctx.fillStyle = 'rgba(3,5,10,0.88)'
        ctx.fillRect(0,0,BW,BH)
        ctx.fillStyle = '#00ffc8'
        ctx.font      = 'bold 15px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('All matched!', BW/2, BH/2-10)
        ctx.fillStyle = 'rgba(0,255,200,0.5)'
        ctx.font      = '11px monospace'
        ctx.fillText(`${moves} moves · Score: ${score}`, BW/2, BH/2+14)
        ctx.fillStyle = 'rgba(0,255,200,0.3)'
        ctx.font      = '10px monospace'
        ctx.fillText('Click to play again', BW/2, BH/2+36)
      }
    }

    function reset() {
      cards=makeDeck(); flipped=[]; matched=0; moves=0; locked=false; score=0; done=false
      draw()
    }

    function onClick(e) {
      if(locked) return
      const rect = ref.current.getBoundingClientRect()
      const mx   = e.clientX - rect.left
      const my   = e.clientY - rect.top - 36

      if(done) { reset(); return }

      const col = Math.floor((mx-PAD)/(SQ+PAD))
      const row = Math.floor((my-PAD)/(SQ+PAD))
      const idx = row*COLS+col
      if(col<0||col>=COLS||row<0||row>=ROWS||idx<0||idx>=cards.length) return

      const card = cards[idx]
      if(card.flipped||card.matched||flipped.includes(idx)) return

      card.flipped=true
      flipped=[...flipped,idx]
      draw()

      if(flipped.length===2) {
        moves++
        locked=true
        const [a,b]=flipped
        if(cards[a].icon===cards[b].icon) {
          cards[a].matched=cards[b].matched=true
          matched+=2
          flipped=[]
          locked=false
          score+=Math.max(10,50-moves)
          onScore(score)
          if(matched===cards.length) { done=true; onWin(score) }
          draw()
        } else {
          setTimeout(()=>{
            cards[a].flipped=cards[b].flipped=false
            flipped=[]; locked=false
            draw()
          }, 800)
        }
      }
    }

    draw()
    ref.current.addEventListener('click', onClick)
    return () => ref.current?.removeEventListener('click', onClick)
  }, [])

  return (
    <canvas ref={ref} width={BW} height={BH}
      style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'4px',cursor:'pointer'}}/>
  )
}
