import { useEffect, useRef } from 'react'

const CW=280,CH=320,PW=8,PH=52,BALL=7,AI_SPEED=2.8

export default function Pong({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    let p1={y:CH/2-PH/2,score:0}
    let ai={y:CH/2-PH/2,score:0}
    let bx=CW/2,by=CH/2,bdx=3,bdy=2.5
    let alive=true,started=false

    function resetBall(dir=1){bx=CW/2;by=CH/2;bdx=dir*3;bdy=(Math.random()-0.5)*4}

    function draw(){
      ctx.fillStyle='#03050a';ctx.fillRect(0,0,CW,CH)
      // Centre line
      for(let y=0;y<CH;y+=16){
        ctx.fillStyle='rgba(0,255,200,0.15)'
        ctx.fillRect(CW/2-0.5,y,1,8)
      }
      // Scores
      ctx.fillStyle='rgba(0,255,200,0.4)';ctx.font='bold 20px monospace';ctx.textAlign='center'
      ctx.fillText(ai.score,CW*0.25,28)
      ctx.fillText(p1.score,CW*0.75,28)
      // Labels
      ctx.fillStyle='rgba(0,255,200,0.2)';ctx.font='7px monospace'
      ctx.fillText('AI',CW*0.25,40)
      ctx.fillText('YOU',CW*0.75,40)
      // Paddles
      ctx.shadowColor='#00ffc8';ctx.shadowBlur=8
      ctx.fillStyle='#00ffc8'
      ctx.fillRect(8,p1.y,PW,PH)
      ctx.fillStyle='#bf00ff'
      ctx.fillRect(CW-8-PW,ai.y,PW,PH)
      ctx.shadowBlur=0
      // Ball
      ctx.shadowColor='#ffffff';ctx.shadowBlur=6
      ctx.fillStyle='#ffffff'
      ctx.beginPath();ctx.arc(bx,by,BALL,0,Math.PI*2);ctx.fill()
      ctx.shadowBlur=0
      if(!started){
        ctx.fillStyle='rgba(3,5,10,0.8)';ctx.fillRect(0,0,CW,CH)
        ctx.fillStyle='#00ffc8';ctx.font='bold 13px monospace';ctx.textAlign='center'
        ctx.fillText('NEON PONG',CW/2,CH/2-20)
        ctx.fillStyle='rgba(0,255,200,0.5)';ctx.font='9px monospace'
        ctx.fillText('W/S or ↑/↓ to move',CW/2,CH/2+2)
        ctx.fillText('First to 7 wins',CW/2,CH/2+18)
        ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='8px monospace'
        ctx.fillText('SPACE to start',CW/2,CH/2+36)
      }
    }

    const keys={}
    function onKey(e){
      keys[e.key]=true
      if(e.key===' '){started=true;e.preventDefault()}
      e.preventDefault()
    }
    function onKeyUp(e){keys[e.key]=false}

    let animFrame
    function loop(){
      if(!alive)return
      if(started){
        // Player movement
        if((keys['ArrowUp']||keys['w']||keys['W'])&&p1.y>4) p1.y-=5
        if((keys['ArrowDown']||keys['s']||keys['S'])&&p1.y<CH-PH-4) p1.y+=5
        // AI tracking
        const aiCenter=ai.y+PH/2
        if(aiCenter<by-4) ai.y=Math.min(CH-PH-4,ai.y+AI_SPEED)
        else if(aiCenter>by+4) ai.y=Math.max(4,ai.y-AI_SPEED)
        // Ball
        bx+=bdx;by+=bdy
        if(by<=BALL||by>=CH-BALL) bdy=-bdy
        // Player paddle hit
        if(bx-BALL<=16&&by>=p1.y&&by<=p1.y+PH){
          bdx=Math.abs(bdx)
          bdy=(by-(p1.y+PH/2))/(PH/2)*4
          bx=16+BALL
        }
        // AI paddle hit
        if(bx+BALL>=CW-16&&by>=ai.y&&by<=ai.y+PH){
          bdx=-Math.abs(bdx)
          bdy=(by-(ai.y+PH/2))/(PH/2)*4
          bx=CW-16-BALL
        }
        // Score
        if(bx<0){ai.score++;onScore(p1.score);if(ai.score>=7){alive=false;cancelAnimationFrame(animFrame);onGameOver(p1.score)}else resetBall(1)}
        if(bx>CW){p1.score++;onScore(p1.score);if(p1.score>=7){alive=false;cancelAnimationFrame(animFrame);onWin(p1.score)}else resetBall(-1)}
      }
      draw();animFrame=requestAnimationFrame(loop)
    }

    window.addEventListener('keydown',onKey)
    window.addEventListener('keyup',onKeyUp)
    draw();animFrame=requestAnimationFrame(loop)
    return()=>{
      alive=false;cancelAnimationFrame(animFrame)
      window.removeEventListener('keydown',onKey)
      window.removeEventListener('keyup',onKeyUp)
    }
  },[])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px'}}/>
}
