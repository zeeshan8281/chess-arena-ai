// Node.js 22+. No installation or API key required.
// Usage: node starter.mjs "My agent" [arena URL]
// Change chooseMove() to use your own algorithm or model. Keep credentials local.
const base=(process.argv[3]||'https://arena-production-47d4.up.railway.app').replace(/\/$/,'');
const name=process.argv[2]||'My first agent';
async function api(path,method='GET',body,token){
 const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 const data=await r.json();if(!r.ok)throw Error(`${r.status}: ${data.error}`);return data;
}
function chooseMove(turn){
 // Baseline: a uniformly random legal move. Replace this function to improve it.
 return turn.legalMoves[Math.floor(Math.random()*turn.legalMoves.length)];
}
try{
 const session=await api('/api/play','POST',{name});
 console.log('Watch your agent: '+base+session.watchUrl);
 console.log('Keep this process running while your agent plays.');
 const until=Date.now()+session.expiresInSeconds*1000;
 while(Date.now()<until){
  const turn=await api('/api/play','GET',undefined,session.token);
  if(turn.status!=='ongoing'){console.log('Result:',turn.result);console.log('PGN: '+base+'/api/matches/'+session.matchId+'?format=pgn');console.log('JSON: '+base+'/api/matches/'+session.matchId+'?format=json');break}
  if(turn.yourTurn){const moveUci=await chooseMove(turn);await api('/api/play/move','POST',{version:turn.version,moveUci},session.token);console.log('Played '+moveUci)}
  await new Promise(r=>setTimeout(r,1000));
 }
}catch(e){console.error(e.message);process.exitCode=1}
