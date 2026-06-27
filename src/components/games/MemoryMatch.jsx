import { useState, useEffect, useRef } from 'react'

const ICONS = ['◈','◆','▲','●','★','♦','♥','♠','◐','◑','▶','◀']
const COLS=4, ROWS=4, TOTAL=COLS*ROWS
const SQ=60, PAD=8
const BW=COLS*SQ+(COLS+1)*PAD
const BH=ROWS*SQ+(ROWS+1)*PAD

function makeCards() {
  const pairs = ICONS.slice(0,TOTAL/2)
  const deck  = [...pairs,...pairs]
  // shuffle
  for(let i=deck.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]]
  }
  return deck.map((icon,i)=>({id:i,icon,flipped:false,matched:false}))
}

const COLORS=['#00ffc8','#bf00ff','#ff003c','#ffcc00','#00c8ff','#ff6600','#00ff66','#ff66ff','#66ffff','#ff9900','#99ff00','#ff0099']

export default function MemoryMatch({ onScore, onGameOver, onWin }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({
    cards: makeCards(),
    flipped: [],
    matched: 0,
    moves: 0,
    locked: false,
    score: 0,
    done: false,
  })
  const [, forceRender] = useState(0)

  function draw() {
    const canvas = canvasRef.current
    if(!canvas) return
    const ctx = canvas.getContext('2d')
    const s   = stateRef.current
    ctx.fillStyle='#03050a'; ctx.fillRect(0,0,BW,BH+50)

    // Header
    ctx.fillStyle='rgba(0,255,200,0.5)'; ctx.font='11px monospace'
    ctx.textAlign='left'; ctx.fillText(`Moves: ${s.moves}`,8,22)
    ctx.textAlign='right'; ctx.fillText(`Matched: ${s.matched/2}/${TOTAL/2}`,BW-8,22)

    s.cards.forEach((card,i)=>{
      const col = i%COLS, row = Math.floor(i/COLS)
      const x   = PAD+col*(SQ+PAD)
      const y   = 34+PAD+row*(SQ+PAD)
      const show= card.flipped||card.matched
      const colorIdx = ICONS.indexOf(card.icon)
      const c   = COLORS[colorIdx] || '#00ffc8'

      if(card.matched){
        ctx.fillStyle=`${c}22`
        ctx.strokeStyle=`${c}66`
      } else if(show){
        ctx.fillStyle='#0d1520'
        ctx.strokeStyle=c
      } else {
        ctx.fillStyle='#0a1520'
        ctx.strokeStyle='rgba(0,255,200,0.2)'
      }
      ctx.lineWidth=show?2:1
      ctx.beginPath(); ctx.roundRect(x,y,SQ,SQ,6); ctx.fill(); ctx.stroke()

      if(show){
        ctx.shadowColor=c; ctx.shadowBlur=card.matched?12:6
        ctx.fillStyle=card.matched?`${c}99`:c
        ctx.font=`bold ${card.matched?28:30}px monospace`
        ctx.textAlign='center'
        ctx.fillText(card.icon, x+SQ/2, y+SQ/2+10)
        ctx.shadowBlur=0
      } else {
        // Card back pattern
        ctx.fillStyle='rgba(0,255,200,0.06)'
        ctx.font='18px monospace'; ctx.textAlign='center'
        ctx.fillText('◈', x+SQ/2, y+SQ/2+6)
      }
    })

    if(s.done){
      ctx.fillStyle='rgba(3,5,10,0.85)'; ctx.fillRect(0,0,BW,BH+50)
      ctx.fillStyle='#00ffc8'; ctx.font='bold 16px monospace'; ctx.textAlign='center'
      ctx.fillText('All matched!', BW/2, BH/2+10)
      ctx.fillStyle='rgba(0,255,200,0.5)'; ctx.font='11px monospace'
      ctx.fillText(`${s.moves} moves · Score: ${s.score}`, BW/2, BH/2+32)
    }
  }

  useEffect(()=>{ draw() })

  function handleClick(e){
    const s = stateRef.current
    if(s.locked||s.done) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx   = e.clientX-rect.left
    const my   = e.clientY-rect.top-34

    const col  = Math.floor((mx-PAD)/(SQ+PAD))
    const row  = Math.floor((my-PAD)/(SQ+PAD))
    const idx  = row*COLS+col

    if(col<0||col>=COLS||row<0||row>=ROWS) return
    const card = s.cards[idx]
    if(card.flipped||card.matched||s.flipped.includes(idx)) return

    card.flipped=true
    s.flipped=[...s.flipped,idx]
    draw()

    if(s.flipped.length===2){
      s.moves++
      s.locked=true
      const [a,b]=s.flipped
      if(s.cards[a].icon===s.cards[b].icon){
        s.cards[a].matched=s.cards[b].matched=true
        s.matched+=2
        s.flipped=[]
        s.locked=false
        const scoreGain=Math.max(10,50-s.moves)
        s.score+=scoreGain
        onScore(s.score)
        if(s.matched===TOTAL){
          s.done=true
          onWin(s.score)
        }
        draw()
      } else {
        setTimeout(()=>{
          s.cards[a].flipped=s.cards[b].flipped=false
          s.flipped=[]
          s.locked=false
          draw(); forceRender(n=>n+1)
        },900)
      }
    }
    forceRender(n=>n+1)
  }

  function reset(){
    stateRef.current={cards:makeCards(),flipped:[],matched:0,moves:0,locked:false,score:0,done:false}
    forceRender(n=>n+1)
  }

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
      <canvas ref={canvasRef} width={BW} height={BH+50}
        style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'4px',cursor:'pointer'}}
        onClick={handleClick}/>
      <button onClick={reset} style={{fontFamily:'var(--mono)',fontSize:'10px',letterSpacing:'0.12em',
        textTransform:'uppercase',padding:'6px 16px',border:'1px solid var(--accent)',
        background:'transparent',color:'var(--accent)',cursor:'pointer'}}>
        New game
      </button>
    </div>
  )
}
