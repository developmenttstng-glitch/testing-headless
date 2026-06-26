import { useEffect, useRef } from 'react'

const S=13,COLS=21,ROWS=24

export default function Snake({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    let snake=[{x:10,y:12},{x:9,y:12},{x:8,y:12}]
    let dir={x:1,y:0},next={x:1,y:0}
    let food={x:16,y:8},score=0,alive=true

    function placeFood(){food={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)}}

    function draw(){
      ctx.fillStyle='#03050a';ctx.fillRect(0,0,280,320)
      // Grid
      ctx.strokeStyle='rgba(0,255,200,0.04)';ctx.lineWidth=0.5
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)ctx.strokeRect(c*S,r*S,S,S)
      // Food - glowing
      ctx.shadowColor='#ff003c';ctx.shadowBlur=12
      ctx.fillStyle='#ff003c'
      ctx.beginPath();ctx.arc(food.x*S+S/2,food.y*S+S/2,4,0,Math.PI*2);ctx.fill()
      ctx.shadowBlur=0
      // Snake
      snake.forEach((seg,i)=>{
        const alpha=Math.max(0.3,1-i*0.04)
        ctx.shadowColor='#00ffc8';ctx.shadowBlur=i===0?10:0
        ctx.fillStyle=i===0?`rgba(0,255,200,${alpha})`:`rgba(0,200,150,${alpha})`
        ctx.fillRect(seg.x*S+1,seg.y*S+1,S-2,S-2)
        ctx.shadowBlur=0
      })
      // Score
      ctx.fillStyle='rgba(0,255,200,0.4)';ctx.font='9px monospace'
      ctx.textAlign='right';ctx.fillText(score,275,12)
    }

    const loop=setInterval(()=>{
      if(!alive)return
      dir={...next}
      const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y}
      if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||snake.some(s=>s.x===head.x&&s.y===head.y)){
        alive=false;clearInterval(loop);onGameOver(score);return
      }
      snake.unshift(head)
      if(head.x===food.x&&head.y===food.y){score+=10;onScore(score);placeFood()}
      else snake.pop()
      draw()
    },105)

    function onKey(e){
      if(e.key==='ArrowLeft'&&dir.x!==1)next={x:-1,y:0}
      else if(e.key==='ArrowRight'&&dir.x!==-1)next={x:1,y:0}
      else if(e.key==='ArrowUp'&&dir.y!==1)next={x:0,y:-1}
      else if(e.key==='ArrowDown'&&dir.y!==-1)next={x:0,y:1}
      e.preventDefault()
    }
    window.addEventListener('keydown',onKey);draw()
    return()=>{clearInterval(loop);window.removeEventListener('keydown',onKey)}
  },[])

  return <canvas ref={ref} width={280} height={320} style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px'}}/>
}
