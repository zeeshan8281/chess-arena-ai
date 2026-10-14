'use client';
import {useState} from 'react';
import type {Row} from './tactics-benchmark';
import './tactics-frontier.css';

export default function TacticsFrontier({rows,onSelect}:{rows:Row[];onSelect:(id:string)=>void}){
 const [metric,setMetric]=useState<'cost'|'latency'>('cost');
 const plotted=rows.filter(r=>r.complete&&(metric==='latency'||r.kind==='model'));
 const value=(r:Row)=>metric==='cost'?r.costMicros/1e6/r.total:r.medianMs/1000;
 const certain=(r:Row)=>metric==='latency'||!r.unknownCostAttempts;
 const frontier=plotted.filter(r=>certain(r)&&!plotted.some(other=>certain(other)&&value(other)<=value(r)&&other.accuracy>=r.accuracy&&(value(other)<value(r)||other.accuracy>r.accuracy))).sort((a,b)=>value(a)-value(b));
 const max=Math.max(...plotted.map(value),.000001)*1.16;
 const x=(r:Row)=>80+value(r)/max*540,y=(r:Row)=>490-r.accuracy/0.8*400;
 const labels=[...plotted].sort((a,b)=>b.accuracy-a.accuracy);
 let previous=70;
 const labelY=new Map(labels.map(r=>{const pos=Math.max(y(r),previous+48);previous=pos;return [r.id,pos]}));
 const format=(n:number)=>metric==='cost'?'$'+n.toFixed(5):n.toFixed(2)+'s';
 return <div className="tactics-frontier">
  <div className="tf-heading"><div><p className="eyebrow">PERFORMANCE / EFFICIENCY</p><h3>Find the <mark>frontier.</mark></h3><p>Accuracy, cost, and time. Every tradeoff visible.</p></div><div className="tf-switch" role="group" aria-label="Performance graph axis">{(['cost','latency'] as const).map(m=><button key={m} aria-pressed={metric===m} onClick={()=>setMetric(m)}>{m==='cost'?'API cost':'Latency'}</button>)}</div></div>
  <p className="tf-legend"><span/> Dotted line: observed Pareto frontier · Higher and further left is better</p>
  <div className="tf-scroll" tabIndex={0} aria-label="Performance graph; scroll horizontally on smaller screens">
  <svg className="tf-chart" viewBox="0 0 1000 620" role="img" aria-label={`First-move accuracy versus ${metric==='cost'?'mean reported API cost per position':'median response time'}, with a Pareto frontier`}>
   {[0,20,40,60,80].map(t=><g key={t}><line x1="80" x2="620" y1={490-t*5} y2={490-t*5} stroke="#dedfd5" strokeDasharray="3 6"/><text x="65" y={495-t*5} textAnchor="end" className="tf-tick">{t}%</text></g>)}
   {[0,1,2,3,4].map(t=><g key={t}><text x={80+t*135} y="520" textAnchor="middle" className="tf-tick">{format(max*t/4)}</text></g>)}
   <path d="M80 90V490H620" fill="none" stroke="#a5aa9c"/>
   <text transform="translate(23 290) rotate(-90)" textAnchor="middle" className="tf-axis">First-move accuracy (%)</text>
   <text x="350" y="563" textAnchor="middle" className="tf-axis">{metric==='cost'?'Mean reported API cost / position (USD)':'Median response time (seconds)'}</text>
   {frontier.length>1&&<polyline data-testid="pareto-line" points={frontier.map(r=>`${x(r)},${y(r)}`).join(' ')} fill="none" stroke="#ddb800" strokeWidth="3" strokeDasharray="3 8" strokeLinecap="round"/>}
   {labels.map((r,i)=><g key={r.id} className="tf-point" role="button" tabIndex={0} aria-label={`Select ${r.label}, ${(r.accuracy*100).toFixed(1)} percent, ${format(value(r))}${!certain(r)?' minimum known cost':''}`} onClick={()=>onSelect(r.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(r.id)}}}>
    <title>{r.label}: {r.successes}/{r.total} correct; {format(value(r))}{!certain(r)?' minimum (incomplete billing)':''}</title>
    <path d={`M${x(r)} ${y(r)} L650 ${labelY.get(r.id)} H675`} fill="none" stroke="#c9cdc0" strokeWidth="1.3"/>
    <circle cx={x(r)} cy={y(r)} r="9" fill={certain(r)?'#faf9f5':'#f5df73'} stroke={r.kind==='model'?'#446345':'#9b7136'} strokeWidth="2.5"/>
    <text x={x(r)} y={y(r)+3.5} textAnchor="middle" className="tf-number">{i+1}</text>
    <rect x="675" y={(labelY.get(r.id)??0)-22} width="310" height="43" rx="4" fill="#faf9f5" stroke="#dedfd5"/>
    <text x="688" y={(labelY.get(r.id)??0)-4} className="tf-label">{r.label}</text>
    <text x="688" y={(labelY.get(r.id)??0)+12} className="tf-value">{(r.accuracy*100).toFixed(1)}% · {format(value(r))}{!certain(r)?'+ · billing incomplete':''}</text>
   </g>)}
  </svg></div>
  <p className="tf-note">{metric==='cost'?'Models only: harness compute is unpriced. Yellow points show minimum known cost where billing is incomplete; they are excluded from the frontier. Cost is the reported run total divided by 32 positions, not median cost.':'Models and harnesses: model latency includes network/provider time; harness latency is local compute. These are different execution environments.'} The frontier uses observed scores, not statistically established superiority. Select a point or label for its evidence below.</p>
 </div>;
}
