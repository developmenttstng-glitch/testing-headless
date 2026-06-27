import { useEffect, useRef } from 'react'

const SQ=36, BW=SQ*8, BH=SQ*8+60
const GLYPHS={wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'}
const INIT=[
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
]
const COL=p=>p?p[0]:null
const TYP=p=>p?p[1]:null
const INB=(r,c)=>r>=0&&r<8&&c>=0&&c<8
const VAL={P:1,N:3,B:3,R:5,Q:9,K:100}

function getMoves(b,r,c,ep,cas){
  const p=b[r][c]; if(!p) return []
  const col=COL(p),pt=TYP(p),mvs=[]
  const add=(nr,nc)=>{
    if(!INB(nr,nc)||COL(b[nr][nc])===col) return false
    mvs.push([nr,nc]); return !b[nr][nc]
  }
  const slide=(dr,dc)=>{
    let nr=r+dr,nc=c+dc
    while(INB(nr,nc)){
      if(COL(b[nr][nc])===col) break
      mvs.push([nr,nc])
      if(b[nr][nc]) break
      nr+=dr;nc+=dc
    }
  }
  if(pt==='P'){
    const d=col==='w'?-1:1,st=col==='w'?6:1
    if(INB(r+d,c)&&!b[r+d][c]){
      mvs.push([r+d,c])
      if(r===st&&!b[r+d*2][c]) mvs.push([r+d*2,c])
    }
    for(const dc of[-1,1]){
      if(INB(r+d,c+dc)){
        if(b[r+d][c+dc]&&COL(b[r+d][c+dc])!==col) mvs.push([r+d,c+dc])
        if(ep&&ep[0]===r+d&&ep[1]===c+dc) mvs.push([r+d,c+dc])
      }
    }
  } else if(pt==='N'){
    for(const[dr,dc]of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r+dr,c+dc)
  } else if(pt==='B'){
    for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,dc)
  } else if(pt==='R'){
    for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc)
  } else if(pt==='Q'){
    for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc)
  } else if(pt==='K'){
    for(const[dr,dc]of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r+dr,c+dc)
    if(cas){
      const row=col==='w'?7:0
      if(r===row&&c===4){
        if(cas[col+'K']&&!b[row][5]&&!b[row][6]) mvs.push([row,6])
        if(cas[col+'Q']&&!b[row][3]&&!b[row][2]&&!b[row][1]) mvs.push([row,2])
      }
    }
  }
  return mvs
}

function inCheck(b,col){
  let kr,kc
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(b[r][c]===col+'K'){kr=r;kc=c}
  if(kr===undefined) return false
  const opp=col==='w'?'b':'w'
  for(let r=0;r<8;r++) for(let c=0;c<8;c++)
    if(COL(b[r][c])===opp&&getMoves(b,r,c,null,null).some(([mr,mc])=>mr===kr&&mc===kc)) return true
  return false
}

function applyMove(b,fr,fc,tr,tc,ep){
  const nb=b.map(r=>[...r])
  nb[tr][tc]=nb[fr][fc]; nb[fr][fc]=null
  if(TYP(nb[tr][tc])==='P'&&ep&&tr===ep[0]&&tc===ep[1]) nb[fr][tc]=null
  return nb
}

function legalMoves(b,r,c,ep,cas){
  const col=COL(b[r][c])
  return getMoves(b,r,c,ep,cas).filter(([tr,tc])=>{
    const nb=applyMove(b,r,c,tr,tc,ep)
    if(TYP(b[r][c])==='K'&&Math.abs(tc-c)===2){
      if(inCheck(b,col)) return false
      const mid=tc>c?c+1:c-1
      if(inCheck(applyMove(b,r,c,r,mid,null),col)) return false
    }
    return !inCheck(nb,col)
  })
}

function aiMove(b,ep,cas){
  let best=null,bScore=-Infinity
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    if(COL(b[r][c])!=='b') continue
    for(const[tr,tc] of legalMoves(b,r,c,ep,cas)){
      let s=0
      if(b[tr][tc]) s+=VAL[TYP(b[tr][tc])]||0
      s+=(3.5-Math.abs(tr-3.5))*0.1+(3.5-Math.abs(tc-3.5))*0.1+Math.random()*0.3
      if(s>bScore){bScore=s;best={r,c,tr,tc}}
    }
  }
  return best
}

export default function Chess({ onScore, onGameOver }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    let board = INIT.map(r=>[...r])
    let selected=null, moves=[], turn='w'
    let ep=null, cas={wK:true,wQ:true,bK:true,bQ:true}
    let status='Your turn (White)', gameOver=false, aiThinking=false
    let capW=[], capB=[]

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,BW,BH)

      // Status
      ctx.fillStyle='rgba(0,255,200,0.6)'; ctx.font='10px monospace'
      ctx.textAlign='center'; ctx.fillText(status,BW/2,16)

      // Captured
      ctx.font='14px monospace'; ctx.textAlign='left'
      ctx.fillText(capB.map(p=>GLYPHS[p]).join(''),4,32)
      ctx.textAlign='right'
      ctx.fillText(capW.map(p=>GLYPHS[p]).join(''),BW-4,32)

      // Board
      for(let r=0;r<8;r++) for(let c=0;c<8;c++){
        const x=c*SQ, y=r*SQ+40
        const isSel=selected&&selected[0]===r&&selected[1]===c
        const isLeg=moves.some(([mr,mc])=>mr===r&&mc===c)
        const isCap=isLeg&&board[r][c]
        let fill=(r+c)%2===0?'#1a2535':'#0d1520'
        if(isSel) fill='rgba(0,255,200,0.22)'
        ctx.fillStyle=fill; ctx.fillRect(x,y,SQ,SQ)
        if(isLeg&&!isCap){
          ctx.fillStyle='rgba(0,255,200,0.3)'
          ctx.beginPath(); ctx.arc(x+SQ/2,y+SQ/2,7,0,Math.PI*2); ctx.fill()
        }
        if(isCap){
          ctx.strokeStyle='rgba(255,0,60,0.5)'; ctx.lineWidth=2
          ctx.strokeRect(x+1,y+1,SQ-2,SQ-2)
        }
      }

      // Coordinates
      ctx.font='8px monospace'; ctx.fillStyle='rgba(0,255,200,0.2)'
      for(let i=0;i<8;i++){
        ctx.textAlign='left'; ctx.fillText(8-i,2,i*SQ+40+12)
        ctx.textAlign='center'; ctx.fillText(String.fromCharCode(97+i),i*SQ+SQ/2,BH-2)
      }

      // Pieces
      ctx.font=`bold ${SQ-8}px monospace`
      for(let r=0;r<8;r++) for(let c=0;c<8;c++){
        const p=board[r][c]; if(!p) continue
        const isSel=selected&&selected[0]===r&&selected[1]===c
        ctx.shadowColor=COL(p)==='w'?'rgba(0,255,200,0.4)':'rgba(0,200,255,0.4)'
        ctx.shadowBlur=isSel?10:3
        ctx.fillStyle=COL(p)==='w'?'#e0f0ff':'#2a5a8a'
        ctx.textAlign='center'
        ctx.fillText(GLYPHS[p],c*SQ+SQ/2,r*SQ+40+SQ-6)
        ctx.shadowBlur=0
      }
    }

    function doMove(b,fr,fc,tr,tc,isAI=false){
      const nb=applyMove(b,fr,fc,tr,tc,ep)
      const col=COL(b[fr][fc]),opp=col==='w'?'b':'w'
      // Capture
      if(b[tr][tc])(col==='w'?capW:capB).push(b[tr][tc])
      if(TYP(b[fr][fc])==='P'&&ep&&tr===ep[0]&&tc===ep[1]){
        nb[fr][tc]=null;(col==='w'?capW:capB).push(opp+'P')
      }
      // Castling rook
      if(TYP(b[fr][fc])==='K'&&Math.abs(tc-fc)===2){
        const row=fr
        if(tc===6){nb[row][5]=nb[row][7];nb[row][7]=null}
        else{nb[row][3]=nb[row][0];nb[row][0]=null}
      }
      // Promotion
      if(TYP(nb[tr][tc])==='P'&&(tr===0||tr===7)) nb[tr][tc]=col+'Q'
      // Castling rights
      if(fr===7&&fc===4||fr===7&&fc===0) cas.wQ=false
      if(fr===7&&fc===4||fr===7&&fc===7) cas.wK=false
      if(fr===0&&fc===4||fr===0&&fc===0) cas.bQ=false
      if(fr===0&&fc===4||fr===0&&fc===7) cas.bK=false
      ep=(TYP(b[fr][fc])==='P'&&Math.abs(tr-fr)===2)?[fr+(tr-fr)/2,fc]:null
      board=nb; selected=null; moves=[]
      // Check game state
      const check=inCheck(nb,opp)
      let hasAny=false
      for(let r=0;r<8&&!hasAny;r++) for(let c=0;c<8&&!hasAny;c++)
        if(COL(nb[r][c])===opp&&legalMoves(nb,r,c,ep,cas).length>0) hasAny=true
      if(!hasAny){
        status=check?`Checkmate! ${col==='w'?'White':'Black'} wins!`:'Stalemate — Draw'
        gameOver=true; onGameOver(0); draw(); return
      }
      if(isAI){
        turn='w'; status=check?'Check! Your turn':'Your turn (White)'
        aiThinking=false; draw()
      } else {
        turn='b'; status=check?'Check! AI thinking...':'AI thinking...'
        draw()
        aiThinking=true
        setTimeout(()=>{
          if(gameOver) return
          const mv=aiMove(board,ep,cas)
          if(mv) doMove(board,mv.r,mv.c,mv.tr,mv.tc,true)
          else{status='Stalemate — Draw';gameOver=true;draw()}
        },350)
      }
    }

    function onClick(e){
      if(gameOver||turn!=='w'||aiThinking) return
      const rect=ref.current.getBoundingClientRect()
      const c=Math.floor((e.clientX-rect.left)/SQ)
      const r=Math.floor((e.clientY-rect.top-40)/SQ)
      if(!INB(r,c)) return
      const p=board[r][c]
      if(selected){
        const[sr,sc]=selected
        if(moves.some(([mr,mc])=>mr===r&&mc===c)){
          doMove(board,sr,sc,r,c)
        } else if(p&&COL(p)==='w'){
          selected=[r,c]; moves=legalMoves(board,r,c,ep,cas); draw()
        } else {
          selected=null; moves=[]; draw()
        }
      } else if(p&&COL(p)==='w'){
        selected=[r,c]; moves=legalMoves(board,r,c,ep,cas); draw()
      }
    }

    function reset(){
      board=INIT.map(r=>[...r]); selected=null; moves=[]; turn='w'
      ep=null; cas={wK:true,wQ:true,bK:true,bQ:true}
      status='Your turn (White)'; gameOver=false; aiThinking=false
      capW=[]; capB=[]; draw()
    }

    ref.current.addEventListener('click', onClick)
    // Double-click to reset
    ref.current.addEventListener('dblclick', reset)
    draw()
    return ()=>{
      ref.current?.removeEventListener('click', onClick)
      ref.current?.removeEventListener('dblclick', reset)
    }
  },[])

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
      <canvas ref={ref} width={BW} height={BH}
        style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
      <div style={{fontFamily:'var(--mono)',fontSize:'9px',color:'var(--muted)',letterSpacing:'0.1em'}}>
        DOUBLE-CLICK TO RESET
      </div>
    </div>
  )
}
