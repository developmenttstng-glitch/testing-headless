import { useEffect, useRef } from 'react'

const WORDS = [
  'neon','glitch','pixel','cyber','void','dark','code','flux',
  'grid','core','sync','node','data','byte','hack','loop',
  'wave','base','mode','scan','link','port','chip','disk',
  'boot','file','zero','root','arch','beam','cell','dart',
  'echo','fast','gate','host','icon','jack','kill','lamp',
  'mask','next','open','ping','quit','rush','safe','time',
  'unix','vibe','warm','xray','yell','zone','acid','bolt',
  'cash','dawn','edge','fork','glow','hive','idle','jest',
]

function pickWords(n) {
  const pool = [...WORDS]
  const out  = []
  for(let i=0;i<n;i++){
    const j=Math.floor(Math.random()*pool.length)
    out.push(pool.splice(j,1)[0])
  }
  return out
}

export default function TypingGame({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')

    const ROUND_WORDS = 10
    let words    = pickWords(ROUND_WORDS)
    let current  = 0   // index into words
    let typed    = ''
    let score    = 0
    let timer    = 30
    let alive    = true
    let started  = false
    let wpm      = 0
    let correct  = 0
    let wrong    = 0
    let flash    = 0
    let flashOk  = false
    let timerId  = null
    let combo    = 0

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,280,320)

      // Title
      ctx.fillStyle='rgba(0,255,200,0.4)'; ctx.font='10px monospace'
      ctx.textAlign='center'; ctx.fillText('TYPING SPEED', 140, 16)

      // HUD
      ctx.fillStyle='rgba(0,255,200,0.7)'; ctx.font='bold 13px monospace'
      ctx.textAlign='left';  ctx.fillText(`Score: ${score}`, 10, 34)
      ctx.textAlign='right'; ctx.fillText(`${timer}s`, 270, 34)
      ctx.fillStyle='rgba(0,255,200,0.3)'; ctx.font='9px monospace'
      ctx.textAlign='left';  ctx.fillText(`✓${correct} ✗${wrong}`, 10, 48)
      if(combo>1){ctx.fillStyle='#ffcc00';ctx.font='bold 9px monospace';ctx.textAlign='right';ctx.fillText(`COMBO x${combo}`,270,48)}

      // Progress dots
      const dotR=4, dotGap=16, dotsW=ROUND_WORDS*dotGap
      const dotsX=(280-dotsW)/2+dotR
      for(let i=0;i<ROUND_WORDS;i++){
        ctx.beginPath()
        ctx.arc(dotsX+i*dotGap, 62, dotR, 0, Math.PI*2)
        if(i<current){ctx.fillStyle='#00ffc8';ctx.shadowColor='#00ffc8';ctx.shadowBlur=6}
        else if(i===current){ctx.fillStyle='rgba(0,255,200,0.4)'}
        else{ctx.fillStyle='rgba(0,255,200,0.1)'}
        ctx.fill(); ctx.shadowBlur=0
      }

      if(!started) {
        // Show first word dimmed with start prompt
        ctx.fillStyle='rgba(0,255,200,0.15)'; ctx.font='bold 32px monospace'
        ctx.textAlign='center'; ctx.fillText(words[0]||'', 140, 145)
        ctx.fillStyle='rgba(0,255,200,0.5)'; ctx.font='10px monospace'
        ctx.fillText('Start typing to begin', 140, 175)
        ctx.fillStyle='rgba(0,255,200,0.2)'; ctx.font='9px monospace'
        ctx.fillText('Type each word · Press Space to confirm', 140, 195)
        return
      }

      // Upcoming words (next 2)
      if(current+1 < words.length){
        ctx.fillStyle='rgba(0,255,200,0.15)'; ctx.font='14px monospace'
        ctx.textAlign='center'; ctx.fillText(words[current+1]||'', 140, 96)
      }
      if(current+2 < words.length){
        ctx.fillStyle='rgba(0,255,200,0.08)'; ctx.font='11px monospace'
        ctx.textAlign='center'; ctx.fillText(words[current+2]||'', 140, 114)
      }

      // Current word — show typed vs remaining
      const word    = words[current] || ''
      const matched = word.startsWith(typed)
      const doneP   = typed.length > 0 ? typed : ''
      const restP   = word.slice(typed.length)

      ctx.font='bold 34px monospace'; ctx.textAlign='center'
      const totalW  = ctx.measureText(word).width
      let cx        = 140 - totalW/2

      // Typed portion
      ctx.fillStyle = matched ? '#00ffc8' : '#ff003c'
      ctx.shadowColor = matched ? '#00ffc8' : '#ff003c'
      ctx.shadowBlur  = 8
      ctx.textAlign='left'
      ctx.fillText(doneP, cx, 158)
      ctx.shadowBlur=0

      // Remaining portion
      ctx.fillStyle='rgba(0,255,200,0.3)'
      const doneW=ctx.measureText(doneP).width
      ctx.fillText(restP, cx+doneW, 158)

      // Cursor blink
      const blinkOn=Math.floor(Date.now()/400)%2===0
      if(blinkOn){
        ctx.fillStyle='rgba(0,255,200,0.8)'
        ctx.fillRect(cx+ctx.measureText(typed).width, 134, 2, 28)
      }

      // Input box
      ctx.strokeStyle=matched?'rgba(0,255,200,0.4)':'rgba(255,0,60,0.4)'
      ctx.lineWidth=1; ctx.strokeRect(50, 174, 180, 28)
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(50,174,180,28)
      ctx.fillStyle=matched?'#00ffc8':'#ff003c'
      ctx.font='14px monospace'; ctx.textAlign='center'
      ctx.fillText(typed||'', 140, 193)

      // Flash
      if(flash>0){
        ctx.fillStyle=flashOk?`rgba(0,255,200,${flash/8})`:`rgba(255,0,60,${flash/8})`
        ctx.fillRect(0,0,280,320)
        ctx.fillStyle=flashOk?'#00ffc8':'#ff003c'
        ctx.font='bold 22px monospace'; ctx.textAlign='center'
        ctx.fillText(flashOk?'✓':'✗',140,175)
        flash--
      }

      // Timer bar
      ctx.fillStyle='rgba(0,255,200,0.08)'; ctx.fillRect(0,312,280,8)
      const pct=timer/30
      ctx.fillStyle=pct>0.4?'#00ffc8':pct>0.2?'#ffcc00':'#ff003c'
      ctx.fillRect(0,312,280*pct,8)

      // WPM
      if(wpm>0){
        ctx.fillStyle='rgba(0,255,200,0.3)'; ctx.font='9px monospace'; ctx.textAlign='center'
        ctx.fillText(`${wpm} WPM`,140,226)
      }
    }

    function submit() {
      const word = words[current]||''
      if(typed.trim()===word) {
        combo++
        const pts=combo>2?20:combo>1?15:10
        score+=pts; onScore(score); correct++
        flash=3; flashOk=true
        // Recalc WPM
        const elapsed=30-timer
        if(elapsed>0) wpm=Math.round((correct/elapsed)*60)
      } else {
        combo=0; wrong++
        flash=4; flashOk=false
      }
      typed=''
      current++
      if(current>=words.length){
        // New set of words
        words=pickWords(ROUND_WORDS); current=0
      }
    }

    function onKey(e) {
      if(!alive) return

      if(!started && e.key.length===1 && e.key!==' ') {
        started=true
        timerId=setInterval(()=>{
          timer--
          if(timer<=0){
            alive=false; clearInterval(timerId)
            onGameOver(score)
          }
          draw()
        },1000)
        typed=e.key; draw(); return
      }

      if(!started) return

      if(e.key==='Backspace') {
        typed=typed.slice(0,-1); draw()
      } else if(e.key===' '||e.key==='Enter') {
        if(typed.length>0) submit()
        draw(); e.preventDefault()
      } else if(e.key.length===1) {
        if(typed.length < 12) typed+=e.key
        draw()
      }
      e.preventDefault()
    }

    // Flash animator
    const flashTimer=setInterval(()=>{if(flash>0){flash--;draw()}},40)
    // Blink cursor
    const blinkTimer=setInterval(()=>{if(started&&alive)draw()},400)

    draw()
    window.addEventListener('keydown', onKey)
    return()=>{
      clearInterval(timerId); clearInterval(flashTimer); clearInterval(blinkTimer)
      window.removeEventListener('keydown', onKey)
    }
  },[])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'text'}}/>
}
