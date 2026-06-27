import { useEffect, useRef } from 'react'

const CW=280, CH=320, GRAVITY=0.25, JUMP=-5.5, PIPE_W=40, GAP=130, PIPE_SPEED=90

export default function FlappyBird({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx   = ref.current.getContext('2d')
    let bird    = { y:CH/2, vy:0, x:60, r:12 }
    let pipes   = []
    let score   = 0
    let alive   = true
    let started = false
    let last    = null
    let pipeTimer = 0

    function addPipe() {
      const top = 40 + Math.random() * (CH - GAP - 80)
      pipes.push({ x:CW, top, scored:false })
    }
    addPipe()

    function draw(dt) {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,CW,CH)

      // Stars
      ctx.fillStyle='rgba(0,255,200,0.15)'
      ;[[30,40],[90,80],[160,50],[220,30],[250,70],[60,120],[180,100]].forEach(([x,y])=>ctx.fillRect(x,y,1,1))

      // Pipes
      pipes.forEach(p=>{
        ctx.fillStyle='#bf00ff'
        ctx.shadowColor='#bf00ff'; ctx.shadowBlur=6
        ctx.fillRect(p.x, 0, PIPE_W, p.top)
        ctx.fillRect(p.x, p.top+GAP, PIPE_W, CH-p.top-GAP)
        ctx.shadowBlur=0
      })

      // Bird
      ctx.shadowColor='#00ffc8'; ctx.shadowBlur=10
      ctx.fillStyle='#00ffc8'
      ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle='#03050a'
      ctx.beginPath(); ctx.arc(bird.x+4, bird.y-3, 3, 0, Math.PI*2); ctx.fill()
      ctx.shadowBlur=0

      // Score
      ctx.fillStyle='rgba(0,255,200,0.7)'; ctx.font='bold 18px monospace'
      ctx.textAlign='center'; ctx.fillText(score, CW/2, 30)

      if (!started) {
        ctx.fillStyle='rgba(3,5,10,0.75)'; ctx.fillRect(0,0,CW,CH)
        ctx.fillStyle='#00ffc8'; ctx.font='bold 13px monospace'
        ctx.fillText('FLAPPY NEON', CW/2, CH/2-14)
        ctx.fillStyle='rgba(0,255,200,0.5)'; ctx.font='10px monospace'
        ctx.fillText('SPACE / CLICK TO START', CW/2, CH/2+8)
      }
    }

    function flap() {
      if (!started) { started=true; return }
      bird.vy = JUMP
    }

    let animFrame
    function loop(ts) {
      if (!alive) return
      if (last === null) { last = ts }
      const dt = Math.min((ts - last) / 1000, 0.05) // cap at 50ms
      last = ts

      if (started) {
        // Physics using delta time
        bird.vy += GRAVITY * dt * 60
        bird.y  += bird.vy * dt * 60

        pipeTimer += dt
        if (pipeTimer > 1.8) { addPipe(); pipeTimer = 0 }

        pipes.forEach(p => { p.x -= PIPE_SPEED * dt })
        pipes = pipes.filter(p => p.x + PIPE_W > -10)

        // Score
        pipes.forEach(p => {
          if (!p.scored && p.x + PIPE_W < bird.x) {
            p.scored = true; score++; onScore(score)
          }
        })

        // Collision
        if (bird.y - bird.r < 0 || bird.y + bird.r > CH) {
          alive=false; cancelAnimationFrame(animFrame); onGameOver(score); draw(dt); return
        }
        for (const p of pipes) {
          if (bird.x+bird.r > p.x && bird.x-bird.r < p.x+PIPE_W) {
            if (bird.y-bird.r < p.top || bird.y+bird.r > p.top+GAP) {
              alive=false; cancelAnimationFrame(animFrame); onGameOver(score); draw(dt); return
            }
          }
        }
      }

      draw(dt)
      animFrame = requestAnimationFrame(loop)
    }

    function onKey(e) { if(e.key===' '){flap();e.preventDefault()} }
    window.addEventListener('keydown',onKey)
    ref.current.addEventListener('click', flap)
    animFrame = requestAnimationFrame(loop)
    return()=>{ alive=false; cancelAnimationFrame(animFrame); window.removeEventListener('keydown',onKey) }
  },[])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
