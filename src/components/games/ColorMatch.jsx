import { useEffect, useRef } from 'react'

// Color Match — the word is painted in a color, tap the tile that matches the INK color
// The word TEXT is a different color name — that's the trick
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

    let score    = 0
    let lives    = 3
    let alive    = true
    let timeLeft = 10
    let streak   = 0
    let timerId  = null

    // Current round state — plain variables
    let wordText   = ''    // the misleading text shown
    let inkColor   = null  // the actual color the word is drawn in = correct answer
    let tiles      = []    // array of 4 {name, hex} color objects shown as buttons
    let flash      = 0     // >0 = showing feedback, counts down
    let flashOk    = false // true=correct, false=wrong

    function rnd(arr) { return arr[Math.floor(Math.random()*arr.length)] }

    function newRound() {
      // inkColor = the color the word is drawn in (what player must match)
      inkColor = rnd(COLORS)
      // wordText = a DIFFERENT color name shown as the word
      const others = COLORS.filter(c => c !== inkColor)
      wordText = rnd(others).name

      // Build 4 tiles: inkColor + 3 random others, shuffled
      const wrong = []
      const pool  = [...others]
      while(wrong.length < 3) {
        const i = Math.floor(Math.random()*pool.length)
        wrong.push(pool.splice(i,1)[0])
      }
      const all = [inkColor, ...wrong]
      // Fisher-Yates shuffle
      for(let i=all.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [all[i],all[j]]=[all[j],all[i]]
      }
      tiles = all

      // Reset timer
      clearInterval(timerId)
      timeLeft = 10
      timerId = setInterval(() => {
        if(!alive) return
        timeLeft--
        if(timeLeft <= 0) {
          clearInterval(timerId)
          lives--
          streak = 0
          flash = 8; flashOk = false
          if(lives <= 0) {
            alive = false
            onGameOver(score)
          } else {
            setTimeout(newRound, 600)
          }
        }
        draw()
      }, 1000)

      draw()
    }

    function draw() {
      ctx.fillStyle = '#03050a'
      ctx.fillRect(0, 0, 280, 320)

      // Header
      ctx.fillStyle = 'rgba(0,255,200,0.4)'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('WHAT COLOR IS THE INK?', 140, 16)

      // HUD
      ctx.fillStyle = 'rgba(0,255,200,0.7)'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`Score: ${score}`, 10, 34)
      ctx.textAlign = 'right'
      ctx.fillText(`❤ ${lives}`, 270, 34)
      ctx.fillStyle = 'rgba(0,255,200,0.35)'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${timeLeft}s`, 140, 34)

      if(streak > 1) {
        ctx.fillStyle = '#ffcc00'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`STREAK x${streak}`, 140, 50)
      }

      // Word display
      if(inkColor) {
        ctx.fillStyle = inkColor.hex
        ctx.shadowColor = inkColor.hex
        ctx.shadowBlur = 18
        ctx.font = 'bold 44px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(wordText, 140, 128)
        ctx.shadowBlur = 0
      }

      // Timer ring
      if(alive && inkColor) {
        const pct = timeLeft / 10
        ctx.strokeStyle = 'rgba(0,255,200,0.12)'
        ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(140, 128, 58, 0, Math.PI*2); ctx.stroke()
        ctx.strokeStyle = pct > 0.4 ? 'rgba(0,255,200,0.4)' : pct > 0.2 ? '#ffcc00' : '#ff003c'
        ctx.beginPath()
        ctx.arc(140, 128, 58, -Math.PI/2, -Math.PI/2 + Math.PI*2*pct)
        ctx.stroke()
      }

      // 4 tiles — 2x2 grid
      const TW = 118, TH = 50, GAP = 8
      const startX = (280 - (TW*2 + GAP)) / 2
      const startY = 178

      for(let i = 0; i < 4; i++) {
        if(!tiles[i]) continue
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = startX + col * (TW + GAP)
        const y = startY + row * (TH + GAP)
        const c = tiles[i]

        ctx.fillStyle = `${c.hex}22`
        ctx.strokeStyle = c.hex
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.roundRect(x, y, TW, TH, 5)
        ctx.fill(); ctx.stroke()

        ctx.fillStyle = c.hex
        ctx.font = 'bold 13px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(c.name, x + TW/2, y + TH/2 + 5)
      }

      // Flash feedback
      if(flash > 0) {
        ctx.fillStyle = flashOk
          ? `rgba(0,255,200,${flash/10})`
          : `rgba(255,0,60,${flash/10})`
        ctx.fillRect(0, 0, 280, 320)
        ctx.fillStyle = flashOk ? '#00ffc8' : '#ff003c'
        ctx.font = 'bold 28px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(flashOk ? '✓' : '✗', 140, 175)
        flash--
      }

      // Game over
      if(!alive) {
        ctx.fillStyle = 'rgba(3,5,10,0.88)'
        ctx.fillRect(0, 0, 280, 320)
        ctx.fillStyle = '#ff003c'
        ctx.font = 'bold 18px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', 140, 130)
        ctx.fillStyle = 'rgba(0,255,200,0.6)'
        ctx.font = '13px monospace'
        ctx.fillText(`Score: ${score}`, 140, 158)
        ctx.fillStyle = 'rgba(0,255,200,0.3)'
        ctx.font = '10px monospace'
        ctx.fillText('Best streak: ' + streak, 140, 178)
      }
    }

    function onClick(e) {
      if(!alive || !inkColor || flash > 0) return
      const rect = ref.current.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      const TW = 118, TH = 50, GAP = 8
      const startX = (280 - (TW*2 + GAP)) / 2
      const startY = 178

      for(let i = 0; i < 4; i++) {
        if(!tiles[i]) continue
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = startX + col * (TW + GAP)
        const y = startY + row * (TH + GAP)

        if(mx >= x && mx <= x+TW && my >= y && my <= y+TH) {
          clearInterval(timerId)
          const correct = tiles[i].hex === inkColor.hex

          if(correct) {
            streak++
            const pts = streak > 2 ? 20 : 10
            score += pts
            onScore(score)
            flash = 6; flashOk = true
            setTimeout(newRound, 400)
          } else {
            streak = 0
            lives--
            flash = 6; flashOk = false
            if(lives <= 0) {
              alive = false
              onGameOver(score)
              draw()
              return
            }
            setTimeout(newRound, 500)
          }
          draw()
          return
        }
      }
    }

    ref.current.addEventListener('click', onClick)
    newRound()

    return () => {
      clearInterval(timerId)
      ref.current?.removeEventListener('click', onClick)
    }
  }, [])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
