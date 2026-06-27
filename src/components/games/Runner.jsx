import { useEffect, useRef } from 'react'

const CW=280, CH=320, GND=CH-40, GRAVITY=18, JUMP=-380, BASE_SPEED=180

export default function Runner({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    let player  = {x:50,y:GND,vy:0,w:20,h:28,onGround:true}
    let obstacles=[], score=0, alive=true, started=false, last=null
    let spawnTimer=0, spawnInterval=1.8, elapsed=0

    function spawnObs() {
      const h=20+Math.random()*40
      obstacles.push({x:CW,y:GND-h+28,w:16,h,col:Math.random()>0.5?'#ff003c':'#bf00ff'})
    }
    spawnObs()

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,CW,CH)
      ctx.fillStyle='rgba(0,255,200,0.15)'
      ;[[30,40],[90,80],[160,50],[220,30],[250,70],[60,120],[180,100]].forEach(([x,y])=>ctx.fillRect(x,y,1,1))
      ctx.strokeStyle='rgba(0,255,200,0.2)'; ctx.lineWidth=1
      ctx.beginPath(); ctx.moveTo(0,GND+28); ctx.lineTo(CW,GND+28); ctx.stroke()
      ctx.strokeStyle='rgba(0,255,200,0.04)'; ctx.lineWidth=0.5
      for(let x=0;x<CW;x+=40){ctx.beginPath();ctx.moveTo(x,GND+28);ctx.lineTo(x,CH);ctx.stroke()}

      ctx.shadowColor='#00ffc8'; ctx.shadowBlur=8
      ctx.fillStyle='#00ffc8'; ctx.fillRect(player.x,player.y,player.w,player.h)
      ctx.fillStyle='#03050a'; ctx.fillRect(player.x+4,player.y+6,12,6)
      ctx.fillStyle='rgba(0,255,200,0.4)'; ctx.fillRect(player.x+5,player.y+7,10,4)
      ctx.shadowBlur=0

      obstacles.forEach(o=>{
        ctx.shadowColor=o.col; ctx.shadowBlur=6
        ctx.fillStyle=o.col; ctx.fillRect(o.x,o.y,o.w,o.h)
        ctx.shadowBlur=0
      })

      ctx.fillStyle='rgba(0,255,200,0.6)'; ctx.font='bold 14px monospace'
      ctx.textAlign='right'; ctx.fillText(score,CW-8,20)
      const speed = BASE_SPEED + elapsed*10
      ctx.fillStyle='rgba(0,255,200,0.2)'; ctx.font='8px monospace'
      ctx.textAlign='left'; ctx.fillText(`SPD ${speed.toFixed(0)}`,8,20)

      if(!started){
        ctx.fillStyle='rgba(3,5,10,0.75)'; ctx.fillRect(0,0,CW,CH)
        ctx.fillStyle='#00ffc8'; ctx.font='bold 13px monospace'
        ctx.textAlign='center'; ctx.fillText('ENDLESS RUNNER',CW/2,CH/2-14)
        ctx.fillStyle='rgba(0,255,200,0.5)'; ctx.font='10px monospace'
        ctx.fillText('SPACE / CLICK TO START',CW/2,CH/2+8)
      }
    }

    function jump(){
      if(!started){started=true;return}
      if(player.onGround){player.vy=JUMP;player.onGround=false}
    }

    let animFrame
    function loop(ts) {
      if(!alive) return
      if(last===null){last=ts}
      const dt = Math.min((ts-last)/1000, 0.05)
      last=ts

      if(started){
        elapsed += dt
        score = Math.floor(elapsed*6)
        onScore(score)

        const speed = BASE_SPEED + elapsed*10

        // Physics
        player.vy += GRAVITY * dt * 60 * 0.16
        player.y  += player.vy * dt
        if(player.y >= GND){ player.y=GND; player.vy=0; player.onGround=true }

        // Spawn
        spawnTimer += dt
        if(spawnTimer >= spawnInterval){
          spawnTimer=0
          spawnInterval = Math.max(0.9, 1.8-elapsed*0.05)
          spawnObs()
        }

        obstacles.forEach(o=>{ o.x -= speed*dt })
        obstacles = obstacles.filter(o=>o.x+o.w>-10)

        // Collision
        for(const o of obstacles){
          if(player.x+player.w-4>o.x&&player.x+4<o.x+o.w&&player.y+player.h-4>o.y&&player.y+4<o.y+o.h){
            alive=false; cancelAnimationFrame(animFrame); onGameOver(score); draw(); return
          }
        }
      }
      draw()
      animFrame = requestAnimationFrame(loop)
    }

    function onKey(e){if(e.key===' '){jump();e.preventDefault()}}
    window.addEventListener('keydown',onKey)
    ref.current.addEventListener('click',jump)
    draw(); animFrame=requestAnimationFrame(loop)
    return()=>{ alive=false; cancelAnimationFrame(animFrame); window.removeEventListener('keydown',onKey) }
  },[])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
