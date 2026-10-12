'use client';
import {useEffect,useState} from 'react';
import {Chessboard} from 'react-chessboard';
import {agentName} from '../src/agents';
export default function Featured({id}:{id:string}){
 const [game,setGame]=useState<{white:string;black:string;frames:{fen:string;san:string}[];result:{reason:string}}|null>(null);
 useEffect(()=>{let stopped=false;setGame(null);fetch('/api/matches/'+id).then(r=>r.ok?r.json():null).then(g=>{if(!stopped)setGame(g)}).catch(()=>{});return()=>{stopped=true}},[id]);
 if(!game)return null;
 return <section className="panel featured-match"><div><Chessboard options={{id:'featured-record',position:game.frames.at(-1)!.fen,allowDragging:false,animationDurationInMs:0,darkSquareStyle:{backgroundColor:'#748169'},lightSquareStyle:{backgroundColor:'#e9e9d7'}}}/></div><div><p className="kicker">FROM THE MATCH ARCHIVE</p><h2>{agentName(game.white)}<br/><span className="subtle">vs</span> {agentName(game.black)}</h2><p className="body-copy">{game.frames.length-1} recorded plies · {game.result.reason.replaceAll('_',' ')}. Follow the game, jump to checks and captures, or download the complete record.</p><a className="outline" href={'/matches/'+id}>Inspect this game →</a></div></section>
}
