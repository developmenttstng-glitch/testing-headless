import { useEffect, useRef } from 'react'

const W=10,H=20,S=14
const COLORS=['#00ffc8','#bf00ff','#ff003c','#00c8ff','#ffcc00','#ff6600','#00ff66']
const PIECES=[
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,0],[0,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[0,1,0],[1,1,1]],
]

export default function Tetris({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    const state = {
      board: Array.from({length:H},()=>Array(W).fill(0)),
      piece:null,px:0,py:0,pc:0,
      score:0,level:1,lines:0,falling:true,
    }

    function valid(p,x,y) {
      for(let r=0;r<p.length;r++)
        for(let c=0;c<p[r].length;c++)
          if(p[r][c]){
            if(x+c<0||x+c>=W||y+r>=H)return false
            if(y+r>=0&&state.board[y+r][x+c])return false
          }
      return true
    }

    function newPiece() {
      state.pc=Math.floor(Math.random()*PIECES.length)
      state.piece=PIECES[state.pc].map(r=>[...r])
      state.px=Math.floor((W-state.piece[0].length)/2)
      state.py=0
      if(!valid(state.piece,state.px,state.py)){
        clearInterval(loop)
        onGameOver(state.score)
        return false
      }
      return true
    }

    function place() {
      state.piece.forEach((row,r)=>row.forEach((v,c)=>{
        if(v&&state.py+r>=0)state.board[state.py+r][state.px+c]=state.pc+1
      }))
      let cleared=0
      state.board=state.board.filter(row=>{
        if(row.every(v=>v)){cleared++;return false}return true
      })
      while(state.board.length<H)state.board.unshift(Array(W).fill(0))
      state.lines+=cleared
      state.score+=[0,100,300,500,800][cleared]*state.level
      state.level=Math.floor(state.lines/10)+1
      onScore(state.score,state.level)
    }

    function draw() {
      ctx.fillStyle='#03050a';ctx.fillRect(0,0,280,320)
      // Grid
      ctx.strokeStyle='#0a1520';ctx.lineWidth=0.5
      for(let r=0;r<H;r++)for(let c=0;c<W;c++)ctx.strokeRect(14+c*S,4+r*S,S,S)
      // Board
      state.board.forEach((row,r)=>row.forEach((v,c)=>{
        if(!v)return
        const col=COLORS[v-1]
        ctx.fillStyle=col
        ctx.fillRect(14+c*S+1,4+r*S+1,S-2,S-2)
        ctx.fillStyle='rgba(255,255,255,0.15)'
        ctx.fillRect(14+c*S+1,4+r*S+1,S-2,3)
        ctx.fillStyle='rgba(0,0,0,0.2)'
        ctx.fillRect(14+c*S+1,4+r*S+S-4,S-2,3)
      }))
      // Active piece
      if(state.piece){
        ctx.fillStyle=COLORS[state.pc]
        state.piece.forEach((row,r)=>row.forEach((v,c)=>{
          if(!v)return
          ctx.fillRect(14+(state.px+c)*S+1,4+(state.py+r)*S+1,S-2,S-2)
          ctx.fillStyle='rgba(255,255,255,0.2)'
          ctx.fillRect(14+(state.px+c)*S+1,4+(state.py+r)*S+1,S-2,3)
          ctx.fillStyle=COLORS[state.pc]
        }))
      }
    }

    newPiece();draw()
    const loop=setInterval(()=>{
      if(!state.falling||!state.piece)return
      if(valid(state.piece,state.px,state.py+1))state.py++
      else{place();if(!newPiece())return}
      draw()
    },Math.max(80,480-state.level*38))

    function onKey(e){
      if(!state.piece)return
      if(e.key==='ArrowLeft'&&valid(state.piece,state.px-1,state.py))state.px--
      else if(e.key==='ArrowRight'&&valid(state.piece,state.px+1,state.py))state.px++
      else if(e.key==='ArrowDown'&&valid(state.piece,state.px,state.py+1))state.py++
      else if(e.key==='ArrowUp'){
        const rot=state.piece[0].map((_,i)=>state.piece.map(r=>r[i]).reverse())
        if(valid(rot,state.px,state.py))state.piece=rot
      }
      else if(e.key===' '){state.falling=!state.falling;e.preventDefault()}
      draw()
    }
    window.addEventListener('keydown',onKey)
    return()=>{clearInterval(loop);window.removeEventListener('keydown',onKey)}
  },[])

  return <canvas ref={ref} width={280} height={320} style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px'}}/>
}
