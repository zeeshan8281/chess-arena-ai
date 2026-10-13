'use client';
import {useState} from 'react';
import {Chessboard} from 'react-chessboard';
import demo from '../../data/demo.json';
export default function Page(){
  const [ply,setPly]=useState(demo.frames.length-1);
  const frame=demo.frames[ply];
  return <main className="replay-page">

    <section className="intro"><p className="eyebrow">CHESS / ENGINEERING PROOF</p><h1>Every move.<br/><em>Accounted for.</em></h1><p className="lede">A persisted game, an authoritative referee, and a replay you can inspect. This fixture verifies the stack—not AI strength.</p></section>
    <div className="arena">
      <section className="board-panel" aria-label="Replay">
        <div className="players"><div><i className="white-dot"/> Scripted White <small>FIXTURE A</small></div><span>1 — 0</span><div>Scripted Black <i className="black-dot"/><small>FIXTURE B</small></div></div>
        <div style={{aspectRatio:'1 / 1',width:'100%'}}><Chessboard options={{id:'validated-replay',position:frame.fen,allowDragging:false,animationDurationInMs:0,darkSquareStyle:{backgroundColor:'#587067'},lightSquareStyle:{backgroundColor:'#e7e3d8'},boardStyle:{borderRadius:'3px'}}}/></div>
        <div className="controls"><button disabled={ply===0} onClick={()=>setPly(0)} aria-label="First position">|←</button><button disabled={ply===0} onClick={()=>setPly(ply-1)} aria-label="Previous move">←</button><span aria-live="polite">{ply===0?'Starting position':`Ply ${ply} · ${frame.san}`}</span><button disabled={ply===demo.frames.length-1} onClick={()=>setPly(ply+1)} aria-label="Next move">→</button><button disabled={ply===demo.frames.length-1} onClick={()=>setPly(demo.frames.length-1)} aria-label="Final position">→|</button></div>
      </section>
      <aside>
        <div className="status"><span className="eyebrow">RECORDED RESULT</span><h2>White wins.</h2><p>Checkmate · Qxf7#</p><span className="tag">UNRATED SCRIPTED FIXTURE</span></div>
        <section className="moves"><h3>Move record</h3><ol>{demo.frames.slice(1).map((move,index)=><li key={move.seq}><button onClick={()=>setPly(index+1)} aria-current={ply===index+1?'step':undefined}><span>{move.seq % 2 ? `${Math.ceil(move.seq/2)}.`:'…'}</span>{move.san}<small>{move.moveUci}</small></button></li>)}</ol></section>
        <div className="proof"><h3>What this demonstrates</h3><p>7 accepted moves. 7 committed events. Reconstructed from PostgreSQL history.</p><p>No paid model call. No rating. Unknown mating adjudications cannot award a win.</p><a href="/api/demo?format=pgn" download="validation-game.pgn">Download PGN ↗</a></div>
      </aside>
    </div>
    <footer><span>TypeScript · Next.js · Node · PostgreSQL</span><span>Replay ≠ live match</span></footer>
  </main>;
}
