import { useEffect, useRef } from 'react'

const CW=280,CH=320

export default function Invaders({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    let player={x:CW/2-12,w:24}
    let bullets=[],invBullets=[],score=0,alive=true
    let invDir=1,invX=0,invY=0,invShoot=0,tick=0
    let autoShootTimer=0

    const invaders=[]
    for(let r=0;r<4;r++) for(let c=0;c<8;c++)
      invaders.push({x:16+c*29,y:30+r*22,alive:true,
        col:r===0?'#bf00ff':r===1?'#00ffc8':r===2?'#00c8ff':'#ffcc00'})

    function shoot(){
      bullets.push({x:player.x+player.w/2-1,y:CH-34})
    }

    function draw(){
      ctx.fillStyle='#03050a';ctx.fillRect(0,0,CW,CH)
      ctx.fillStyle='rgba(255,255,255,0.2)'
      ;[[22,18],[80,45],[140,22],[200,60],[250,30],[60,90],[170,80],[230,100]].forEach(([x,y])=>{
        ctx.fillRect(x,(y+tick*0.06)%CH,1,1)
      })
      invaders.forEach(inv=>{
        if(!inv.alive)return
        const x=inv.x+invX,y=inv.y+invY
        ctx.shadowColor=inv.col;ctx.shadowBlur=6
        ctx.fillStyle=inv.col
        ctx.fillRect(x+3,y,14,10)
        ctx.fillRect(x,y+3,20,6)
        ctx.fillRect(x-2,y+6,5,5)
        ctx.fillRect(x+17,y+6,5,5)
        ctx.fillStyle='#03050a'
        ctx.fillRect(x+5,y+2,4,4);ctx.fillRect(x+11,y+2,4,4)
        ctx.shadowBlur=0
      })
      ctx.shadowColor='#00ffc8';ctx.shadowBlur=8
      ctx.fillStyle='#00ffc8'
      ctx.fillRect(player.x,CH-20,player.w,10)
      ctx.fillRect(player.x+10,CH-28,4,10)
      ctx.shadowBlur=0
      bullets.forEach(b=>{
        ctx.shadowColor='#00ffc8';ctx.shadowBlur=6
        ctx.fillStyle='#00ffc8';ctx.fillRect(b.x,b.y,2,10)
        ctx.shadowBlur=0
      })
      invBullets.forEach(b=>{
        ctx.shadowColor='#ff003c';ctx.shadowBlur=6
        ctx.fillStyle='#ff003c';ctx.fillRect(b.x,b.y,2,10)
        ctx.shadowBlur=0
      })
      ctx.fillStyle='rgba(0,255,200,0.5)';ctx.font='9px monospace'
      ctx.textAlign='right';ctx.fillText(score,CW-6,14)
      ctx.textAlign='left';ctx.fillStyle='rgba(0,255,200,0.25)'
      ctx.fillText('AUTO-FIRE',6,14)
    }

    let frame
    function loop(){
      if(!alive)return
      tick++
      bullets.forEach(b=>b.y-=5)
      invBullets.forEach(b=>b.y+=1.4)  // slower enemy bullets — was 2.5
      bullets=bullets.filter(b=>b.y>0)
      invBullets=invBullets.filter(b=>b.y<CH)

      // Auto fire every 24 frames (slower than before)
      autoShootTimer++
      if(autoShootTimer>=24){ autoShootTimer=0; shoot() }

      invX+=invDir*0.3  // slower invader movement — was 0.45
      const living=invaders.filter(i=>i.alive)
      if(!living.length){alive=false;onWin(score);return}
      const left=Math.min(...living.map(i=>i.x+invX))
      const right=Math.max(...living.map(i=>i.x+invX+20))
      if(right>=CW-2||left<=2){invDir=-invDir;invY+=8}
      if(living.some(i=>i.y+invY+10>=CH-20)){alive=false;onGameOver(score);return}

      bullets.forEach((b,bi)=>invaders.forEach(inv=>{
        if(!inv.alive)return
        if(b.x+2>inv.x+invX&&b.x<inv.x+invX+20&&
           b.y+10>inv.y+invY&&b.y<inv.y+invY+12){
          inv.alive=false;bullets.splice(bi,1);score+=10;onScore(score)
        }
      }))
      invBullets.forEach(b=>{
        if(b.y+10>CH-20&&b.x+2>player.x&&b.x<player.x+player.w){
          alive=false;cancelAnimationFrame(frame);onGameOver(score)
        }
      })

      // Enemy shoots every 80 frames — much slower than before (was 55)
      invShoot++
      if(invShoot>80){
        invShoot=0
        const s=living[Math.floor(Math.random()*living.length)]
        invBullets.push({x:s.x+invX+8,y:s.y+invY+12})
      }

      draw();frame=requestAnimationFrame(loop)
    }

    function onKey(e){
      if(e.key==='ArrowLeft') player.x=Math.max(0,player.x-16)
      else if(e.key==='ArrowRight') player.x=Math.min(CW-player.w,player.x+16)
      else if(e.key===' '){ shoot(); e.preventDefault() }
      if(['ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown',onKey);draw();frame=requestAnimationFrame(loop)
    return()=>{alive=false;cancelAnimationFrame(frame);window.removeEventListener('keydown',onKey)}
  },[])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px'}}/>
}
