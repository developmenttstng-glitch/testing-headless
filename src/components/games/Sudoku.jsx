import { useEffect, useRef } from 'react'

const SQ=28, OX=4, OY=36, GRID=SQ*9

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]};return b}
function valid(b,r,c,n){for(let i=0;i<9;i++){if(b[r][i]===n||b[i][c]===n)return false;const br=3*Math.floor(r/3)+Math.floor(i/3),bc=3*Math.floor(c/3)+(i%3);if(b[br][bc]===n)return false};return true}
function solve(b){for(let r=0;r<9;r++)for(let c=0;c<9;c++){if(b[r][c]===0){for(const n of shuffle([1,2,3,4,5,6,7,8,9])){if(valid(b,r,c,n)){b[r][c]=n;if(solve(b))return true;b[r][c]=0}}return false}};return true}

function generate(diff) {
  const b=Array.from({length:9},()=>Array(9).fill(0))
  solve(b); const sol=b.map(r=>[...r])
  const cells=shuffle(Array.from({length:81},(_,i)=>[Math.floor(i/9),i%9]))
  const rem={easy:30,medium:45,hard:55}[diff]||45
  let n=0; for(const[r,c]of cells){if(n>=rem)break;b[r][c]=0;n++}
  return {puzzle:b,solution:sol}
}

const NC=['','#00ffc8','#00c8ff','#ff6600','#bf00ff','#ff003c','#ffcc00','#00ff66','#ff66ff','#fff']
const PAD_Y = OY+GRID+5   // numpad y
const PAD_H = 18
const BTN_Y = PAD_Y+PAD_H+4
const BTN_H = 16

export default function Sudoku({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')

    let puzzle=null, solution=null, grid=null, notes=null
    let sel=null, errors=new Set(), noteMode=false
    let timer=0, running=false, won=false, mistakes=0
    let diff='medium', score=0, timerId=null

    function newGame(d) {
      diff=d||diff
      const g=generate(diff)
      puzzle=g.puzzle.map(r=>[...r]); solution=g.solution; grid=g.puzzle.map(r=>[...r])
      notes=Array.from({length:9},()=>Array.from({length:9},()=>new Set()))
      sel=null; errors=new Set(); won=false; mistakes=0; score=0; timer=0; running=true
      clearInterval(timerId)
      timerId=setInterval(()=>{if(running){timer++;draw()}},1000)
      draw()
    }

    function fmt(s){return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}

    function draw() {
      ctx.fillStyle='#03050a'; ctx.fillRect(0,0,280,320)

      // Header
      ctx.fillStyle='rgba(0,255,200,0.6)'; ctx.font='10px monospace'
      ctx.textAlign='left';  ctx.fillText(`⏱ ${fmt(timer)}`,6,16)
      ctx.textAlign='center';ctx.fillText(noteMode?'📝 Note':'✏ Normal',140,16)
      ctx.textAlign='right'; ctx.fillText(`✗ ${mistakes}/3`,274,16)
      ctx.fillStyle='rgba(0,255,200,0.2)'; ctx.font='8px monospace'
      ctx.textAlign='center'; ctx.fillText(diff.toUpperCase(),140,28)

      if(!grid){ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('Loading...',140,160);return}

      // Cells
      for(let r=0;r<9;r++)for(let c=0;c<9;c++){
        const x=OX+c*SQ, y=OY+r*SQ
        const locked=puzzle[r][c]!==0
        const err=errors.has(`${r}-${c}`)
        const isSel=sel&&sel[0]===r&&sel[1]===c
        const sameNum=sel&&!isSel&&grid[r][c]!==0&&grid[r][c]===grid[sel[0]][sel[1]]
        const sameBox=sel&&Math.floor(r/3)===Math.floor(sel[0]/3)&&Math.floor(c/3)===Math.floor(sel[1]/3)
        const sameLine=sel&&(r===sel[0]||c===sel[1])
        ctx.fillStyle=isSel?'#002818':err?'#1a0010':sameNum?'#001828':sameBox||sameLine?'#0d1825':'#0a1520'
        ctx.fillRect(x,y,SQ,SQ)
        const val=grid[r][c]
        if(val!==0){
          ctx.fillStyle=err?'#ff003c':locked?'#e0f0ff':'#00ffc8'
          ctx.font=`${locked?'bold ':''}15px monospace`; ctx.textAlign='center'
          ctx.fillText(val, x+SQ/2, y+SQ/2+5)
        } else {
          notes[r][c].forEach(n=>{
            const nr=Math.floor((n-1)/3), nc=(n-1)%3
            ctx.fillStyle='rgba(0,255,200,0.4)'; ctx.font='7px monospace'; ctx.textAlign='center'
            ctx.fillText(n, x+nc*(SQ/3)+SQ/6, y+nr*(SQ/3)+SQ/3)
          })
        }
      }

      // Grid lines
      for(let i=0;i<=9;i++){
        ctx.strokeStyle=i%3===0?'rgba(0,255,200,0.5)':'rgba(0,255,200,0.1)'
        ctx.lineWidth=i%3===0?1.5:0.5
        ctx.beginPath();ctx.moveTo(OX+i*SQ,OY);ctx.lineTo(OX+i*SQ,OY+GRID);ctx.stroke()
        ctx.beginPath();ctx.moveTo(OX,OY+i*SQ);ctx.lineTo(OX+GRID,OY+i*SQ);ctx.stroke()
      }

      // Numpad
      const PW=(280-OX*2)/9
      for(let n=1;n<=9;n++){
        const px=OX+(n-1)*PW
        ctx.fillStyle='#0d1825'; ctx.fillRect(px,PAD_Y,PW-1,PAD_H)
        ctx.strokeStyle='rgba(0,255,200,0.15)'; ctx.lineWidth=0.5; ctx.strokeRect(px,PAD_Y,PW-1,PAD_H)
        ctx.fillStyle=NC[n]; ctx.font='bold 11px monospace'; ctx.textAlign='center'
        ctx.fillText(n, px+PW/2, PAD_Y+12)
      }

      // Buttons
      const bw=(280-OX*2)/5
      const btns=[{l:'Easy',d:'easy'},{l:'Med',d:'medium'},{l:'Hard',d:'hard'},{l:'📝',d:'note'},{l:'⌫',d:'del'}]
      btns.forEach(({l,d},i)=>{
        const bx=OX+i*bw
        ctx.fillStyle='#0a1520'; ctx.fillRect(bx,BTN_Y,bw-2,BTN_H)
        ctx.strokeStyle=d==='note'&&noteMode?'rgba(0,255,200,0.6)':'rgba(0,255,200,0.15)'; ctx.lineWidth=0.5
        ctx.strokeRect(bx,BTN_Y,bw-2,BTN_H)
        ctx.fillStyle=d==='note'&&noteMode?'#00ffc8':'rgba(0,255,200,0.5)'; ctx.font='8px monospace'; ctx.textAlign='center'
        ctx.fillText(l, bx+bw/2, BTN_Y+11)
      })

      if(won){
        ctx.fillStyle='rgba(3,5,10,0.88)'; ctx.fillRect(0,0,280,320)
        ctx.fillStyle='#00ffc8'; ctx.font='bold 16px monospace'; ctx.textAlign='center'; ctx.fillText('Solved!',140,145)
        ctx.fillStyle='rgba(0,255,200,0.5)'; ctx.font='11px monospace'
        ctx.fillText(`${fmt(timer)} · Score: ${score}`,140,167)
        ctx.fillStyle='rgba(0,255,200,0.3)'; ctx.font='10px monospace'
        ctx.fillText('Click to play again',140,188)
      }
      if(mistakes>=3&&!won){
        ctx.fillStyle='rgba(3,5,10,0.88)'; ctx.fillRect(0,0,280,320)
        ctx.fillStyle='#ff003c'; ctx.font='bold 14px monospace'; ctx.textAlign='center'; ctx.fillText('Game Over',140,145)
        ctx.fillStyle='rgba(255,0,60,0.4)'; ctx.font='10px monospace'; ctx.fillText('Click to try again',140,167)
      }
    }

    function input(n) {
      if(!sel||won||mistakes>=3)return
      const[r,c]=sel; if(puzzle[r][c]!==0)return
      if(n===0){grid[r][c]=0;errors.delete(`${r}-${c}`);notes[r][c]=new Set();draw();return}
      if(noteMode){const ns=notes[r][c];ns.has(n)?ns.delete(n):ns.add(n);draw();return}
      grid[r][c]=n
      if(solution[r][c]!==n){
        errors.add(`${r}-${c}`); mistakes++
        if(mistakes>=3){running=false;clearInterval(timerId);onGameOver(score)}
      } else {
        errors.delete(`${r}-${c}`)
        if(grid.every((row,ri)=>row.every((v,ci)=>v===solution[ri][ci]))){
          won=true; running=false; clearInterval(timerId)
          score=Math.max(100,1000-timer*2-mistakes*50); onScore(score); onWin(score)
        }
      }
      draw()
    }

    function onClick(e) {
      if(won||mistakes>=3){newGame();return}
      const rect=ref.current.getBoundingClientRect()
      const mx=e.clientX-rect.left, my=e.clientY-rect.top

      // Numpad
      const PW=(280-OX*2)/9
      if(my>=PAD_Y&&my<PAD_Y+PAD_H){const n=Math.floor((mx-OX)/PW)+1;if(n>=1&&n<=9){input(n);return}}

      // Buttons
      if(my>=BTN_Y&&my<BTN_Y+BTN_H){
        const bw=(280-OX*2)/5, bi=Math.floor((mx-OX)/bw)
        if(bi===0)newGame('easy'); else if(bi===1)newGame('medium'); else if(bi===2)newGame('hard')
        else if(bi===3){noteMode=!noteMode;draw()} else if(bi===4)input(0)
        return
      }

      // Grid
      const c=Math.floor((mx-OX)/SQ), r=Math.floor((my-OY)/SQ)
      if(r>=0&&r<9&&c>=0&&c<9){sel=sel&&sel[0]===r&&sel[1]===c?null:[r,c];draw()}
    }

    function onKey(e) {
      const n=parseInt(e.key)
      if(n>=1&&n<=9){input(n);e.preventDefault()}
      if(e.key==='Backspace'||e.key==='Delete'||e.key==='0'){input(0);e.preventDefault()}
      if(e.key.toLowerCase()==='n'){noteMode=!noteMode;draw()}
      if(sel&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
        const[r,c]=sel, d={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key]
        sel=[Math.max(0,Math.min(8,r+d[0])),Math.max(0,Math.min(8,c+d[1]))]; draw(); e.preventDefault()
      }
    }

    newGame()
    ref.current.addEventListener('click', onClick)
    window.addEventListener('keydown', onKey)
    return()=>{clearInterval(timerId);ref.current?.removeEventListener('click',onClick);window.removeEventListener('keydown',onKey)}
  },[])

  return <canvas ref={ref} width={280} height={320}
    style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
}
