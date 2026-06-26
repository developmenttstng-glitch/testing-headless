import { useEffect, useRef } from 'react'

const CW=280,CH=320,G=0.38,JUMP=-7,GAP=88,PW=28

export default function FlappyBird({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    let bird={y:CH/2,v:0},pipes=[],score=0,alive=true,started=false,frame

    function addPipe(){
      const gapY=75+Math.random()*(CH-160)
      pipes.push({x:CW,gapY,passed:false})
    }
    addPipe()

    function draw(){
      ctx.fillStyle='#03050a';ctx.fillRect(0,0,CW,CH)
      // Starfield
      ctx.fillStyle='rgba(0,255,200,0.15)'
      ;[[30,20],[90,55],[160,30],[220,70],[260,25],[50,100],[180,90],[240,110]].forEach(([x,y])=>{
        ctx.fillRect(x,y,1,1)
      })
      // Pipes
      pipes.forEach(p=>{
        const topH=p.gapY-GAP/2,botY=p.gapY+GAP/2
        ctx.shadowColor='#bf00ff';ctx.shadowBlur=8
        ctx.fillStyle='#1a0030'
        ctx.fillRect(p.x,0,PW,topH)
        ctx.fillRect(p.x,botY,PW,CH-botY)
        ctx.fillStyle='#bf00ff'
        ctx.fillRect(p.x-3,topH-12,PW+6,12)
        ctx.fillRect(p.x-3,botY,PW+6,12)
        ctx.shadowBlur=0
      })
      // Bird
      ctx.save()
      ctx.translate(60,bird.y)
      ctx.rotate(Math.min(Math.max(bird.v*0.06,-0.4),0.6))
      ctx.shadowColor='#00ffc8';ctx.shadowBlur=12
      ctx.fillStyle='#00ffc8'
      ctx.beginPath();ctx.ellipse(0,0,10,8,0,0,Math.PI*2);ctx.fill()
      ctx.fillStyle='#003320'
      ctx.beginPath();ctx.arc(6,-2,2.5,0,Math.PI*2);ctx.fill()
      ctx.fillStyle='#00ffc8';ctx.shadowBlur=0
      ctx.beginPath();ctx.moveTo(9,1);ctx.lineTo(15,-1);ctx.lineTo(9,3);ctx.fill()
      ctx.restore()
      // Score
      ctx.fillStyle='rgba(0,255,200,0.6)';ctx.font='bold 20px monospace'
      ctx.textAlign='center';ctx.fillText(score,CW/2,32)
      if(!started){
        ctx.fillStyle='rgba(3,5,10,0.7)';ctx.fillRect(0,0,CW,CH)
        ctx.fillStyle='#00ffc8';ctx.font='bold 14px monospace'
        ctx.fillText('FLAPPY NEON',CW/2,CH/2-16)
        ctx.fillStyle='rgba(0,255,200,0.5)';ctx.font='10px monospace'
        ctx.fillText('SPACE / CLICK TO FLY',CW/2,CH/2+8)
      }
    }

    function flap(){
      if(!started)started=true
      bird.v=JUMP
    }

    function loop(){
      if(!alive)return
      if(started){
        bird.v+=G;bird.y+=bird.v
        pipes.forEach(p=>p.x-=2.2)
        pipes=pipes.filter(p=>p.x+PW>-10)
        if(!pipes.length||pipes[pipes.length-1].x<CW-175)addPipe()
        pipes.forEach(p=>{
          if(!p.passed&&p.x+PW<60){p.passed=true;score++;onScore(score)}
          if(60+10>p.x&&60-10<p.x+PW){
            if(bird.y-8<p.gapY-GAP/2||bird.y+8>p.gapY+GAP/2){
              alive=false;cancelAnimationFrame(frame);onGameOver(score);draw();return
            }
          }
        })
        if(bird.y>CH+20||bird.y<-20){alive=false;cancelAnimationFrame(frame);onGameOver(score);draw();return}
      }
      draw();frame=requestAnimationFrame(loop)
    }

    function onKey(e){if(e.key===' '){flap();e.preventDefault()}}
    const canvas=ref.current
    window.addEventListener('keydown',onKey)
    canvas.addEventListener('click',flap)
    draw();frame=requestAnimationFrame(loop)
    return()=>{alive=false;cancelAnimationFrame(frame);window.removeEventListener('keydown',onKey);canvas.removeEventListener('click',flap)}
  },[])

  return <canvas ref={ref} width={280} height={320} style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
