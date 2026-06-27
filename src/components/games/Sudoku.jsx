import { useEffect, useRef } from 'react'

const COLS=9, SQ=34, BW=COLS*SQ, BH=COLS*SQ+80

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]};return b}

function valid(b,r,c,n){
  for(let i=0;i<9;i++){
    if(b[r][i]===n||b[i][c]===n) return false
    const br=3*Math.floor(r/3)+Math.floor(i/3),bc=3*Math.floor(c/3)+(i%3)
    if(b[br][bc]===n) return false
  }
  return true
}

function solve(b){
  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    if(b[r][c]===0){
      for(const n of shuffle([1,2,3,4,5,6,7,8,9])){
        if(valid(b,r,c,n)){b[r][c]=n;if(solve(b))return true;b[r][c]=0}
      }
      return false
    }
  }
  return true
}

function generate(diff){
  const b=Array.from({length:9},()=>Array(9).fill(0))
  solve(b)
  const sol=b.map(r=>[...r])
  const remove={easy:30,medium:45,hard:55}[diff]||45
  const cells=shuffle(Array.from({length:81},(_,i)=>[Math.floor(i/9),i%9]))
  let removed=0
  for(const[r,c] of cells){if(removed>=remove)break;b[r][c]=0;removed++}
  return{puzzle:b,solution:sol}
}

const NUMCOLORS=['','#00ffc8','#00c8ff','#ff6600','#bf00ff','#ff003c','#ffcc00','#00ff66','#ff66ff','#ffffff']

export default function Sudoku({ onScore, onGameOver, onWin }) {
  const ref = useRef(null)

  useEffect(()=>{
    const ctx=ref.current.getContext('2d')
    let puzzle=null,solution=null,grid=null
    let selected=null,errors=new Set(),noteMode=false
    let notes=null,timer=0,running=false,won=false,mistakes=0
    let diff='medium',score=0,interval=null

    function newGame(d=diff){
      diff=d
      const g=generate(d)
      puzzle=g.puzzle.map(r=>[...r])
      solution=g.solution
      grid=g.puzzle.map(r=>[...r])
      notes=Array.from({length:9},()=>Array.from({length:9},()=>new Set()))
      selected=null;errors=new Set();won=false;mistakes=0;score=0
      timer=0;running=true
      if(interval) clearInterval(interval)
      interval=setInterval(()=>{if(running){timer++;draw()}},1000)
      draw()
    }

    function fmtTime(s){return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}

    function draw(){
      ctx.fillStyle='#03050a';ctx.fillRect(0,0,BW,BH)

      // Header bar
      ctx.fillStyle='rgba(0,255,200,0.5)';ctx.font='11px monospace';ctx.textAlign='left'
      ctx.fillText(`⏱ ${fmtTime(timer)}`,6,18)
      ctx.textAlign='center'
      ctx.fillText(noteMode?'📝 Note mode':'✏ Normal',BW/2,18)
      ctx.textAlign='right'
      ctx.fillText(`✗ ${mistakes}/3`,BW-6,18)

      if(!grid){
        ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='12px monospace';ctx.textAlign='center'
        ctx.fillText('Loading...',BW/2,BH/2)
        return
      }

      // Cells
      for(let r=0;r<9;r++) for(let c=0;c<9;c++){
        const x=c*SQ,y=r*SQ+24
        const locked=puzzle[r][c]!==0
        const err=errors.has(`${r}-${c}`)
        const isSel=selected&&selected[0]===r&&selected[1]===c
        const sameNum=selected&&!isSel&&grid[r][c]!==0&&grid[r][c]===grid[selected[0]][selected[1]]
        const sameBox=selected&&Math.floor(r/3)===Math.floor(selected[0]/3)&&Math.floor(c/3)===Math.floor(selected[1]/3)
        const sameLine=selected&&(r===selected[0]||c===selected[1])

        let bg='#0a1520'
        if(isSel) bg='#002818'
        else if(err) bg='#1a0010'
        else if(sameNum) bg='#001828'
        else if(sameBox||sameLine) bg='#0d1825'

        ctx.fillStyle=bg;ctx.fillRect(x,y,SQ,SQ)

        const val=grid[r][c]
        if(val!==0){
          ctx.fillStyle=err?'#ff003c':locked?'#e0f0ff':'#00ffc8'
          ctx.font=`${locked?'bold ':''}18px monospace`
          ctx.textAlign='center'
          ctx.fillText(val,x+SQ/2,y+SQ/2+6)
        } else if(notes){
          const ns=notes[r][c]
          ns.forEach(n=>{
            const nr=Math.floor((n-1)/3),nc=(n-1)%3
            ctx.fillStyle='rgba(0,255,200,0.45)';ctx.font='8px monospace';ctx.textAlign='center'
            ctx.fillText(n,x+nc*(SQ/3)+SQ/6,y+nr*(SQ/3)+SQ/4+1)
          })
        }
      }

      // Grid lines
      for(let i=0;i<=9;i++){
        ctx.strokeStyle=i%3===0?'rgba(0,255,200,0.5)':'rgba(0,255,200,0.1)'
        ctx.lineWidth=i%3===0?1.5:0.5
        ctx.beginPath();ctx.moveTo(i*SQ,24);ctx.lineTo(i*SQ,24+9*SQ);ctx.stroke()
        ctx.beginPath();ctx.moveTo(0,24+i*SQ);ctx.lineTo(BW,24+i*SQ);ctx.stroke()
      }

      // Number pad
      const py=24+9*SQ+8
      for(let n=1;n<=9;n++){
        const px=(n-1)*(BW/9)
        ctx.fillStyle='#0d1825';ctx.fillRect(px,py,BW/9-1,26)
        ctx.strokeStyle='rgba(0,255,200,0.2)';ctx.lineWidth=0.5;ctx.strokeRect(px,py,BW/9-1,26)
        ctx.fillStyle=NUMCOLORS[n];ctx.font='bold 14px monospace';ctx.textAlign='center'
        ctx.fillText(n,px+BW/18,py+18)
      }

      // Bottom buttons
      const by=py+30
      const btns=[['Easy','#00ffc8'],['Med','#ffcc00'],['Hard','#ff003c'],['📝',noteMode?'#00ffc8':'#4a6a8a'],['⌫','#4a6a8a']]
      btns.forEach(([lbl,col],i)=>{
        const bx=i*(BW/5)
        ctx.fillStyle='#0a1520';ctx.fillRect(bx,by,BW/5-2,20)
        ctx.strokeStyle=col+'55';ctx.lineWidth=0.5;ctx.strokeRect(bx,by,BW/5-2,20)
        ctx.fillStyle=col;ctx.font='9px monospace';ctx.textAlign='center'
        ctx.fillText(lbl,bx+BW/10,by+13)
      })

      if(won){
        ctx.fillStyle='rgba(3,5,10,0.85)';ctx.fillRect(0,0,BW,BH)
        ctx.fillStyle='#00ffc8';ctx.font='bold 16px monospace';ctx.textAlign='center'
        ctx.fillText('Solved!',BW/2,BH/2-10)
        ctx.fillStyle='rgba(0,255,200,0.5)';ctx.font='11px monospace'
        ctx.fillText(`${fmtTime(timer)} · Score: ${score}`,BW/2,BH/2+12)
        ctx.fillStyle='rgba(0,255,200,0.3)';ctx.font='10px monospace'
        ctx.fillText('Click to play again',BW/2,BH/2+32)
      }
      if(mistakes>=3&&!won){
        ctx.fillStyle='rgba(3,5,10,0.85)';ctx.fillRect(0,0,BW,BH)
        ctx.fillStyle='#ff003c';ctx.font='bold 14px monospace';ctx.textAlign='center'
        ctx.fillText('Game Over',BW/2,BH/2-10)
        ctx.fillStyle='rgba(255,0,60,0.5)';ctx.font='10px monospace'
        ctx.fillText('Click to try again',BW/2,BH/2+12)
      }
    }

    function inputNum(n){
      if(!selected||won||mistakes>=3) return
      const[r,c]=selected
      if(puzzle[r][c]!==0) return
      if(n===0){
        grid[r][c]=0;errors.delete(`${r}-${c}`)
        if(notes) notes[r][c]=new Set()
        draw();return
      }
      if(noteMode){
        if(!notes) return
        const ns=notes[r][c]
        ns.has(n)?ns.delete(n):ns.add(n)
        draw();return
      }
      grid[r][c]=n
      if(solution[r][c]!==n){
        errors.add(`${r}-${c}`);mistakes++
        if(mistakes>=3){running=false;clearInterval(interval);onGameOver(score)}
      } else {
        errors.delete(`${r}-${c}`)
        const complete=grid.every((row,ri)=>row.every((v,ci)=>v===solution[ri][ci]))
        if(complete){
          won=true;running=false;clearInterval(interval)
          score=Math.max(100,1000-timer*2-mistakes*50)
          onScore(score);onWin(score)
        }
      }
      draw()
    }

    function onClick(e){
      if(won&&!running){newGame(diff);return}
      if(mistakes>=3&&!won){newGame(diff);return}
      const rect=ref.current.getBoundingClientRect()
      const mx=e.clientX-rect.left,my=e.clientY-rect.top

      // Numpad click
      const py=24+9*SQ+8
      if(my>=py&&my<py+26){
        const n=Math.floor(mx/(BW/9))+1
        if(n>=1&&n<=9){inputNum(n);return}
      }

      // Bottom buttons
      const by=py+30
      if(my>=by&&my<by+20){
        const bi=Math.floor(mx/(BW/5))
        if(bi===0) newGame('easy')
        else if(bi===1) newGame('medium')
        else if(bi===2) newGame('hard')
        else if(bi===3){noteMode=!noteMode;draw()}
        else if(bi===4) inputNum(0)
        return
      }

      // Board click
      const c=Math.floor(mx/SQ),r=Math.floor((my-24)/SQ)
      if(r>=0&&r<9&&c>=0&&c<9){
        selected=selected&&selected[0]===r&&selected[1]===c?null:[r,c]
        draw()
      }
    }

    function onKey(e){
      const n=parseInt(e.key)
      if(n>=1&&n<=9){inputNum(n);e.preventDefault()}
      if(e.key==='Backspace'||e.key==='Delete'||e.key==='0'){inputNum(0);e.preventDefault()}
      if(e.key.toLowerCase()==='n'){noteMode=!noteMode;draw()}
      // Arrow navigation
      if(selected&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
        const[r,c]=selected
        const d={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key]
        const nr=Math.max(0,Math.min(8,r+d[0])),nc=Math.max(0,Math.min(8,c+d[1]))
        selected=[nr,nc];draw();e.preventDefault()
      }
    }

    newGame()
    ref.current.addEventListener('click',onClick)
    window.addEventListener('keydown',onKey)
    return()=>{
      clearInterval(interval)
      ref.current?.removeEventListener('click',onClick)
      window.removeEventListener('keydown',onKey)
    }
  },[])

  return (
    <canvas ref={ref} width={BW} height={BH}
      style={{display:'block',border:'1px solid rgba(0,255,200,0.15)',borderRadius:'2px',cursor:'pointer'}}/>
  )
}
