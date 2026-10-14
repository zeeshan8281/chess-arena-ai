import {ImageResponse} from 'next/og';
import {getAgentCard} from '../../../../src/agent-card';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,a=await getAgentCard(id);if(!a)return new Response('Agent not found',{status:404});
 const palettes=[['#254b3c','#bcd2a8'],['#3c475c','#b7c9dd'],['#5a4434','#dec49b'],['#503d54','#cbb6ce']];const [dark,accent]=palettes[parseInt(a.id.replaceAll('-','').slice(0,4),16)%palettes.length];
 return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',background:'#f5f3ec',color:'#242c24',fontFamily:'sans-serif'}}>
 <div style={{display:'flex',flexDirection:'column',width:770,padding:'48px 54px'}}>
 <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:23}}><span>CHESS ARENA</span><span style={{fontSize:14,letterSpacing:3,color:'#6a7465'}}>BUILT TO COMPETE</span></div>
 <div style={{display:'flex',marginTop:47,fontSize:15,letterSpacing:4,color:dark}}>{a.tier.toUpperCase()} / AGENT {a.id.slice(0,6).toUpperCase()}</div>
 <div style={{display:'flex',fontSize:a.name.length>22?48:65,wordBreak:'break-all',width:662,fontWeight:700,letterSpacing:-3,lineHeight:1.05,marginTop:16,height:144,alignItems:'center'}}>{a.name}</div>
 <div style={{display:'flex',gap:9,marginTop:9,fontSize:17,color:dark}}><span style={{padding:'9px 13px',background:'#e5e7dc',borderRadius:5}}>v{a.version} · {a.brain==='model'?a.model.slice(0,35):a.brain}</span><span style={{padding:'9px 13px',border:'1px solid #d8dbcf',borderRadius:5}}>{a.versions} {a.versions===1?'build':'builds'}</span></div>
 <div style={{display:'flex',marginTop:33,gap:52}}>{[[String(a.points),'CHALLENGE POINTS'],[`${a.cleared} / 3`,'CHALLENGES CLEARED']].map(([value,label])=><div key={label} style={{display:'flex',flexDirection:'column'}}><span style={{fontSize:44,fontWeight:700}}>{value}</span><span style={{fontSize:11,letterSpacing:2,color:'#69715f',marginTop:7}}>{label}</span></div>)}</div>
 <div style={{display:'flex',justifyContent:'space-between',marginTop:'auto',paddingTop:24,borderTop:'1px solid #d5d9cb',fontSize:16}}><span>Different minds. Same 64 squares.</span><span style={{color:dark}}>chessarena.fun</span></div>
 </div>
 <div style={{width:430,height:'100%',display:'flex',position:'relative',background:dark,overflow:'hidden'}}>
 <div style={{display:'flex',position:'absolute',left:-20,top:70,width:480,height:480,flexWrap:'wrap',transform:'rotate(-12deg)',opacity:.25}}>{Array.from({length:64},(_,i)=><div key={i} style={{width:60,height:60,background:(Math.floor(i/8)+i)%2?accent:dark}}/>)}</div>
 <div style={{display:'flex',position:'absolute',left:69,top:155,width:290,height:290,borderRadius:145,border:`1px solid ${accent}`,background:dark,alignItems:'center',justifyContent:'center'}}>
 <svg width="190" height="220" viewBox="0 0 190 220"><path d="M40 188h119v15H31v-15h9zm8-13c1-31 28-49 34-74l-26 16-30-17 19-35 37-33 6-24 24 25c39 17 47 49 44 86l-3 56H48zm26-96 12-5-4-10-12 5z" fill={accent}/></svg>
 </div>
 <div style={{display:'flex',position:'absolute',bottom:54,left:57,fontSize:16,letterSpacing:4,color:accent}}>MEET YOUR NEXT RIVAL</div>
 </div></div>,{width:1200,height:630,headers:{'Cache-Control':'public, max-age=60, s-maxage=60',...(new URL(request.url).searchParams.has('download')?{'Content-Disposition':`attachment; filename="chess-arena-${a.id.slice(0,8)}.png"`}:{})}});
}
