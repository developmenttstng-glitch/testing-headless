import { useEffect, useRef } from 'react'

// Color Match — tap the tile that matches the word color, not the word text
export default function ColorMatch({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')

    const COLORS = [
      { name:'RED',    hex:'#ff003c' },
      { name:'CYAN',   hex:'#00ffc8' },
      { name:'PURPLE', hex:'#bf00ff' },
      { name:'YELLOW', hex:'#ffcc00' },
      { name:'BLUE',   hex:'#00c8ff' },
      { name:'GREEN',  hex:'#00ff66' },
    ]

    // State
    let score     = 0
    let lives     = 3
    let alive     = true
    let timeLeft  = 0
    let timerId   = null
    let target    = null  // { name, hex } — the COLOR of the word shown
    let options   = []    // 4 tiles shown
    let flash     = null  // {correct, t}
    let streak    = 0
    let best      = 0

    function pick(arr, n) {
      const s = [...arr]; const r = []
      for(let i=0;i<n;i++){const j=Math.floor(Math.random()*s.length);r.push(s.splice(j,1)[0])}
      return r
    }

    function newRound() {
      // Target = a color object — the COLOUR (hex) of the displayed word
      target = COLORS[Math.floor(Math.random()*COLORS.length)]
      // Word text = a DIFFERENT color name (mismatch = the trick)
      const others = COLORS.filter(c=>c!==target)
      const wordColor = others[Math.floor(Math.random()*others.length)]
      // 4 option tiles — one is the correct color, 3 are distractors
      const wrong = pick(others.filter(c=>c!==target), 3)
      options = pick([target,...wrong], 4)
      options._wordText = wordColor.name  // store the misleading text
      options._wordColor = target         // the actual color of the word = answer

      // Timer per round
      clearInterval(timerId)
      timeLeft = 10
      timerId = setInterval(() => {
        timeLeft--
        if(timeLeft <= 0) {
          clearInterval(timerId)
          lives--
          streak = 0
          flash = { correct:false, t:8 }
          if(lives <= 0) { alive=false; onGameOver(score) }
          else setTimeout(newRound, 500)
        }
        draw()
      }, 1000)
      draw()
    }

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,280,320)

      // Title
      ctx.fillStyle='rgba(0,255,200,0.4)'; ctx.font='10px monospace'
      ctx.textAlign='center'; ctx.fillText('WHAT COLOR IS THIS WORD?',140,18)

      // HUD
      ctx.fillStyle='rgba(0,255,200,0.7)'; ctx.font='bold 13px monospace'
      ctx.textAlign='left'; ctx.fillText(`Score: ${score}`,10,36)
      ctx.textAlign='right'; ctx.fillText('❤️'.repeat(lives),270,36)
      ctx.fillStyle='rgba(0,255,200,0.3)'; ctx.font='10px monospace'
      ctx.textAlign='center'; ctx.fillText(`${timeLeft}s`,140,36)

      if(streak>1){ctx.fillStyle='#ffcc00';ctx.font='bold 10px monospace';ctx.fillText(`Streak x${streak}!`,140,52)}

      // Word display
      if(target) {
        const wc = options._wordColor?.hex || '#fff'
        ctx.fillStyle=wc
        ctx.shadowColor=wc; ctx.shadowBlur=15
        ctx.font='bold 42px monospace'; ctx.textAlign='center'
        ctx.fillText(options._wordText||'', 140, 130)
        ctx.shadowBlur=0
      }

      // Timer arc
      if(alive && target) {
        const pct = timeLeft/10
        ctx.strokeStyle='rgba(0,255,200,0.15)'; ctx.lineWidth=3
        ctx.beginPath(); ctx.arc(140,130,55,0,Math.PI*2); ctx.stroke()
        ctx.strokeStyle=pct>0.4?'rgba(0,255,200,0.5)':pct>0.2?'#ffcc00':'#ff003c'
        ctx.beginPath(); ctx.arc(140,130,-Math.PI/2,-Math.PI/2+Math.PI*2*pct,false)
        ctx.stroke()
      }

      // 4 option tiles
      const TW=116, TH=52, GAP=8
      const startX=(280-(TW*2+GAP))/2
      options.forEach&&options.forEach((opt,i) => {
        const col=i%2, row=Math.floor(i/2)
        const x=startX+col*(TW+GAP), y=190+row*(TH+GAP)
        ctx.fillStyle=`${opt.hex}22`
        ctx.strokeStyle=opt.hex; ctx.lineWidth=1.5
        ctx.beginPath(); ctx.roundRect(x,y,TW,TH,6); ctx.fill(); ctx.stroke()
        ctx.fillStyle=opt.hex; ctx.font='bold 12px monospace'; ctx.textAlign='center'
        ctx.fillText(opt.name,x+TW/2,y+TH/2+4)
      })

      // Flash feedback
      if(flash && flash.t>0) {
        ctx.fillStyle=flash.correct?`rgba(0,255,200,${flash.t/12})`:`rgba(255,0,60,${flash.t/12})`
        ctx.fillRect(0,0,280,320)
        ctx.fillStyle=flash.correct?'#00ffc8':'#ff003c'
        ctx.font='bold 22px monospace'; ctx.textAlign='center'
        ctx.fillText(flash.correct?'✓':'✗',140,165)
        flash.t--
      }

      if(!alive) {
        ctx.fillStyle='rgba(3,5,10,0.88)'; ctx.fillRect(0,0,280,320)
        ctx.fillStyle='#ff003c'; ctx.font='bold 18px monospace'; ctx.textAlign='center'
        ctx.fillText('GAME OVER',140,130)
        ctx.fillStyle='rgba(0,255,200,0.6)'; ctx.font='13px monospace'
        ctx.fillText(`Score: ${score}`,140,158)
        ctx.fillStyle='rgba(0,255,200,0.3)'; ctx.font='10px monospace'
        ctx.fillText('Best streak: '+best,140,178)
      }
    }

    function onClick(e) {
      if(!alive||!target) return
      const rect=ref.current.getBoundingClientRect()
      const mx=e.clientX-rect.left, my=e.clientY-rect.top
      const TW=116, TH=52, GAP=8, startX=(280-(TW*2+GAP))/2
      options.forEach&&options.forEach((opt,i) => {
        const col=i%2, row=Math.floor(i/2)
        const x=startX+col*(TW+GAP), y=190+row*(TH+GAP)
        if(mx>=x&&mx<=x+TW&&my>=y&&my<=y+TH) {
          clearInterval(timerId)
          const correct = opt===options._wordColor
          if(correct) {
            streak++; if(streak>best)best=streak
            const bonus=streak>2?20:10
            score+=bonus; onScore(score)
            flash={correct:true,t:8}
            setTimeout(newRound,400)
          } else {
            streak=0; lives--
            flash={correct:false,t:8}
            if(lives<=0){alive=false;onGameOver(score);draw();return}
            setTimeout(newRound,500)
          }
          draw()
        }
      })
    }

    ref.current.addEventListener('click',onClick)
    newRound()
    return()=>{clearInterval(timerId);ref.current?.removeEventListener('click',onClick)}
  },[])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
