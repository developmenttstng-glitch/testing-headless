import { useEffect, useRef } from 'react'

const CW=280, CH=320
// 9x9 grid, fit in 280px wide with small padding
const SQ=28, GRID_LEFT=8, GRID_TOP=38, GRID_W=SQ*9 // =252

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]};return b}
function valid(b,r,c,n){for(let i=0;i<9;i++){if(b[r][i]===n||b[i][c]===n)return false;const br=3*Math.floor(r/3)+Math.floor(i/3),bc=3*Math.floor(c/3)+(i%3);if(b[br][bc]===n)return false};return true}
function solve(b){for(let r=0;r<9;r++)for(let c=0;c<9;c++){if(b[r][c]===0){for(const n of shuffle([1,2,3,4,5,6,7,8,9])){if(valid(b,r,c,n)){b[r][c]=n;if(solve(b))return true;b[r][c]=0}}return false}};return true}

function generate(diff){
  const b=Array.from({length:9},()=>Array(9).fill(0))
  solve(b);const sol=b.map(r=>[...r])
  const rem={easy:30,medium:45,hard:55}[diff]||45
  const cells=shuffle(Array.from({length:81},(_,i)=>[Math.floor(i/9),i%9]))
  let n=0;for(const[r,c]of cells){if(n>=rem)break;b[r][c]=0;n++}
  return{puzzle:b,solution:sol}
}

const NC=['','#00ffc8','#00c8ff','#ff6600','#bf00ff','#ff003c','#ffcc00','#00ff66','#ff66ff','#ffffff']

// Button bar at bottom
const BTN_Y=GRID_TOP+SQ*9+6, BTN_H=18
const BTNS=[{lbl:'Easy',d:'easy'},{lbl:'Med',d:'medium'},{lbl:'Hard',d:'hard'},{lbl:'📝',d:'note'},{lbl:'⌫',d:'del'}]
const BTN_W=(CW-GRID_LEFT*2)/5

export default function Sudoku({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)

  useEffect(()=>{
    const ctx=ref.current.getContext('2d')
    let puzzle=null,solution=null,grid=null,notes=null
    let selected=null,errors=new Set(),noteMode=false
    let timer=0,running=false,won=false,mistakes=0,diff='medium',score=0
    let interval=null

    function newGame(d){
      diff=d||diff
      const g=generate(diff)
      puzzle=g.puzzle.map(r=>[...r]);solution=g.solution;grid=g.puzzle.map(r=>[...r])
      notes=Array.from({length:9},()=>Array.from({length:9},()=>new Set()))
      selected=null;errors=new Set();won=false;mistakes=0;score=0;timer=0;running=true
      clearInterval(interval);interval=setInterval(()=>{if(running){timer++;draw()}},1000)
      draw()
    }

    function fmt(s){return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}

    function draw(){
      ctx.fillStyle='#03050a';ctx.fillRect(0,0,CW,CH)
      // Header
      ctx.fillStyle='rgba(0,255,200,0.6)';ctx.font='10px monospace'
      ctx.textAlign='left';ctx.fillText(`⏱ ${fmt(timer)}`,6,16)
      ctx.textAlign='center';ctx.fillText(noteMode?'📝 Note':'✏ Normal',CW/2,16)
      ctx.textAlign='right';ctx.fillText(`✗ ${mistakes}/3`,CW-6,16)
      ctx.fillStyle='rgba(0,255,200,0.2)';ctx.font='8px monospace'
      ctx.textAlign='center';ctx.fillText(diff.toUpperCase(),CW/2,28)

      if(!grid){ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('Loading...',CW/2,CH/2);return}

      // Cells
      for(let r=0;r<9;r++)for(let c=0;c<9;c++){
        const x=GRID_LEFT+c*SQ,y=GRID_TOP+r*SQ
        const locked=puzzle[r][c]!==0,err=errors.has(`${r}-${c}`)
        const isSel=selected&&selected[0]===r&&selected[1]===c
        const sameNum=selected&&!isSel&&grid[r][c]!==0&&grid[r][c]===grid[selected[0]][selected[1]]
        const sameBox=selected&&Math.floor(r/3)===Math.floor(selected[0]/3)&&Math.floor(c/3)===Math.floor(selected[1]/3)
        const sameLine=selected&&(r===selected[0]||c===selected[1])
        let bg='#0a1520'
        if(isSel)bg='#002818';else if(err)bg='#1a0010';else if(sameNum)bg='#001828';else if(sameBox||sameLine)bg='#0d1825'
        ctx.fillStyle=bg;ctx.fillRect(x,y,SQ,SQ)
        const val=grid[r][c]
        if(val!==0){
          ctx.fillStyle=err?'#ff003c':locked?'#e0f0ff':'#00ffc8'
          ctx.font=`${locked?'bold ':''}15px monospace`;ctx.textAlign='center'
          ctx.fillText(val,x+SQ/2,y+SQ/2+5)
        } else if(notes){
          notes[r][c].forEach(n=>{
            const nr=Math.floor((n-1)/3),nc=(n-1)%3
            ctx.fillStyle='rgba(0,255,200,0.4)';ctx.font='7px monospace';ctx.textAlign='center'
            ctx.fillText(n,x+nc*(SQ/3)+SQ/6,y+nr*(SQ/3)+SQ/4)
          })
        }
      }

      // Grid lines
      for(let i=0;i<=9;i++){
        ctx.strokeStyle=i%3===0?'rgba(0,255,200,0.5)':'rgba(0,255,200,0.1)'
        ctx.lineWidth=i%3===0?1.5:0.5
        ctx.beginPath();ctx.moveTo(GRID_LEFT+i*SQ,GRID_TOP);ctx.lineTo(GRID_LEFT+i*SQ,GRID_TOP+SQ*9);ctx.stroke()
        ctx.beginPath();ctx.moveTo(GRID_LEFT,GRID_TOP+i*SQ);ctx.lineTo(GRID_LEFT+GRID_W,GRID_TOP+i*SQ);ctx.stroke()
      }

      // Number pad — single row below grid
      const PY=GRID_TOP+SQ*9+4, PH=16, PW=(CW-GRID_LEFT*2)/9
      for(let n=1;n<=9;n++){
        const px=GRID_LEFT+(n-1)*PW
        ctx.fillStyle='#0d1825';ctx.fillRect(px,PY,PW-1,PH)
        ctx.strokeStyle='rgba(0,255,200,0.15)';ctx.lineWidth=0.5;ctx.strokeRect(px,PY,PW-1,PH)
        ctx.fillStyle=NC[n];ctx.font='bold 11px monospace';ctx.textAlign='center'
        ctx.fillText(n,px+PW/2,PY+11)
      }

      // Bottom buttons
      BTNS.forEach(({lbl},i)=>{
        const bx=GRID_LEFT+i*BTN_W
        ctx.fillStyle='#0a1520';ctx.fillRect(bx,BTN_Y,BTN_W-2,BTN_H)
        ctx.strokeStyle=i===3&&noteMode?'rgba(0,255,200,0.6)':'rgba(0,255,200,0.15)';ctx.lineWidth=0.5
        ctx.strokeRect(bx,BTN_Y,BTN_W-2,BTN_H)
        ctx.fillStyle=i===3&&noteMode?'#00ffc8':'rgba(0,255,200,0.5)';ctx.font='8px monospace';ctx.textAlign='center'
        ctx.fillText(lbl,bx+BTN_W/2,BTN_Y+12)
      })

      if(won){
        ctx.fillStyle='rgba(3,5,10,0.88)';ctx.fillRect(0,0,CW,CH)
        ctx.fillStyle='#00ffc8';ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText('Solved!',CW/2,CH/2-10)
        ctx.fillStyle='rgba(0,255,200,0.5)';ctx.font='11px monospace';ctx.fillText(`${fmt(timer)} · Score: ${score}`,CW/2,CH/2+12)
        ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='10px monospace';ctx.fillText('Click to play again',CW/2,CH/2+32)
      }
      if(mistakes>=3&&!won){
        ctx.fillStyle='rgba(3,5,10,0.88)';ctx.fillRect(0,0,CW,CH)
        ctx.fillStyle='#ff003c';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText('Game Over',CW/2,CH/2-10)
        ctx.fillStyle='rgba(255,0,60,0.4)';ctx.font='10px monospace';ctx.fillText('Click to try again',CW/2,CH/2+12)
      }
    }

    function inputNum(n){
      if(!selected||won||mistakes>=3)return
      const[r,c]=selected;if(puzzle[r][c]!==0)return
      if(n===0){grid[r][c]=0;errors.delete(`${r}-${c}`);if(notes)notes[r][c]=new Set();draw();return}
      if(noteMode){if(notes){const ns=notes[r][c];ns.has(n)?ns.delete(n):ns.add(n);draw()};return}
      grid[r][c]=n
      if(solution[r][c]!==n){errors.add(`${r}-${c}`);mistakes++;if(mistakes>=3){running=false;clearInterval(interval);onGameOver(score)}}
      else{errors.delete(`${r}-${c}`);if(grid.every((row,ri)=>row.every((v,ci)=>v===solution[ri][ci]))){won=true;running=false;clearInterval(interval);score=Math.max(100,1000-timer*2-mistakes*50);onScore(score);onWin(score)}}
      draw()
    }

    function onClick(e){
      if(won||mistakes>=3){newGame();return}
      const rect=ref.current.getBoundingClientRect()
      const mx=e.clientX-rect.left,my=e.clientY-rect.top
      // Numpad
      const PY=GRID_TOP+SQ*9+4,PH=16,PW=(CW-GRID_LEFT*2)/9
      if(my>=PY&&my<PY+PH){const n=Math.floor((mx-GRID_LEFT)/PW)+1;if(n>=1&&n<=9){inputNum(n);return}}
      // Buttons
      if(my>=BTN_Y&&my<BTN_Y+BTN_H){
        const bi=Math.floor((mx-GRID_LEFT)/BTN_W)
        if(bi===0)newGame('easy');else if(bi===1)newGame('medium');else if(bi===2)newGame('hard');else if(bi===3){noteMode=!noteMode;draw()}else if(bi===4)inputNum(0)
        return
      }
      // Grid
      const c=Math.floor((mx-GRID_LEFT)/SQ),r=Math.floor((my-GRID_TOP)/SQ)
      if(r>=0&&r<9&&c>=0&&c<9){selected=selected&&selected[0]===r&&selected[1]===c?null:[r,c];draw()}
    }

    function onKey(e){
      const n=parseInt(e.key)
      if(n>=1&&n<=9){inputNum(n);e.preventDefault()}
      if(e.key==='Backspace'||e.key==='Delete'||e.key==='0'){inputNum(0);e.preventDefault()}
      if(e.key.toLowerCase()==='n'){noteMode=!noteMode;draw()}
      if(selected&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
        const[r,c]=selected,d={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key]
        selected=[Math.max(0,Math.min(8,r+d[0])),Math.max(0,Math.min(8,c+d[1]))];draw();e.preventDefault()
      }
    }

    newGame()
    ref.current.addEventListener('click',onClick)
    window.addEventListener('keydown',onKey)
    return()=>{clearInterval(interval);ref.current?.removeEventListener('click',onClick);window.removeEventListener('keydown',onKey)}
  },[])

  return <canvas ref={ref} width={CW} height={CH}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
