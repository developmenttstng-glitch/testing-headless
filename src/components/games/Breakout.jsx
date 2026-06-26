import { useEffect, useRef } from 'react'

const CW=280,CH=320,COLS=8,ROWS=5,BW=28,BH=10
const COLORS=['#ff003c','#bf00ff','#00ffc8','#00c8ff','#ffcc00']

export default function Breakout({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    let bx=CW/2,by=CH-55,dx=3.2,dy=-3.2
    let px=CW/2-30,pw=60,score=0,lives=3,running=true

    const bricks=[]
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)
      bricks.push({x:c*(BW+4)+6,y:r*(BH+5)+32,alive:true,col:COLORS[r%COLORS.length]})

    function draw(){
      ctx.fillStyle='#03050a';ctx.fillRect(0,0,CW,CH)
      bricks.forEach(b=>{
        if(!b.alive)return
        ctx.shadowColor=b.col;ctx.shadowBlur=6
        ctx.fillStyle=b.col;ctx.fillRect(b.x,b.y,BW,BH)
        ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect(b.x,b.y,BW,3)
        ctx.shadowBlur=0
      })
      // Paddle
      ctx.shadowColor='#00ffc8';ctx.shadowBlur=10
      ctx.fillStyle='#003322';ctx.fillRect(px,CH-18,pw,6)
      ctx.fillStyle='#00ffc8';ctx.fillRect(px,CH-18,pw,2)
      ctx.shadowBlur=0
      // Ball
      ctx.shadowColor='#ffffff';ctx.shadowBlur=8
      ctx.fillStyle='#ffffff'
      ctx.beginPath();ctx.arc(bx,by,6,0,Math.PI*2);ctx.fill()
      ctx.shadowBlur=0
      // Lives
      ctx.fillStyle='rgba(0,255,200,0.4)';ctx.font='9px monospace'
      ctx.textAlign='left';ctx.fillText('◆'.repeat(lives),6,16)
      ctx.textAlign='right';ctx.fillText(score,275,16)
    }

    let frame
    function loop(){
      if(!running)return
      bx+=dx;by+=dy
      if(bx<=6||bx>=CW-6)dx=-dx
      if(by<=6)dy=-dy
      if(by>=CH-18-6&&bx>=px&&bx<=px+pw){
        dy=-Math.abs(dy);dx+=(bx-(px+pw/2))*0.06;by=CH-18-6
      }
      if(by>CH+20){
        lives--;if(lives<=0){running=false;onGameOver(score);return}
        bx=CW/2;by=CH-60;dx=3.2;dy=-3.2
      }
      bricks.forEach(b=>{
        if(!b.alive)return
        if(bx+6>b.x&&bx-6<b.x+BW&&by+6>b.y&&by-6<b.y+BH){
          b.alive=false;dy=-dy;score+=10;onScore(score)
        }
      })
      if(bricks.every(b=>!b.alive)){running=false;onWin(score);return}
      draw();frame=requestAnimationFrame(loop)
    }

    function onKey(e){
      if(e.key==='ArrowLeft')px=Math.max(0,px-18)
      else if(e.key==='ArrowRight')px=Math.min(CW-pw,px+18)
      e.preventDefault()
    }
    window.addEventListener('keydown',onKey);draw();frame=requestAnimationFrame(loop)
    return()=>{running=false;cancelAnimationFrame(frame);window.removeEventListener('keydown',onKey)}
  },[])

  return <canvas ref={ref} width={280} height={320} style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px'}}/>
}
