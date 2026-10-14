import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// Reproduce selection from the pinned public CSV; output separately, never rewrite scored fixtures.
const source=process.argv[2],out=process.argv[3];if(!source||!out)throw Error('Usage: node --import tsx scripts/select-tactics.ts SOURCE.csv OUTPUT.json');
const frozen=JSON.parse(await readFile('public/benchmarks/tactics/positions.json','utf8')),csv=await readFile(source);
if(createHash('sha256').update(csv).digest('hex')!==frozen.sourceSha256)throw Error('CSV differs from the pinned source; create a new suite version');
const [header,...lines]=csv.toString('utf8').trim().split(/\r?\n/),columns=header.split(',');
const rows=lines.map(line=>{const values=line.split(',');if(values.length!==columns.length||line.includes('"'))throw Error('Unsupported CSV encoding');return Object.fromEntries(columns.map((key,i)=>[key,values[i]]))});
const hash=(id:string)=>createHash('sha256').update('chess-arena-tactics-v1:'+id).digest('hex');
const positions=frozen.bands.flatMap(([band,low,high]:[string,number,number])=>rows.filter(r=>+r.Rating>=low&&+r.Rating<=high&&+r.Popularity>=80&&+r.NbPlays>=1000).sort((a,b)=>hash(a.PuzzleId).localeCompare(hash(b.PuzzleId))).slice(0,8).map(r=>({id:r.PuzzleId,fenBefore:r.FEN,line:r.Moves.split(' '),rating:+r.Rating,band,themes:r.Themes.split(' '),gameUrl:r.GameUrl})));
if(JSON.stringify(positions)!==JSON.stringify(frozen.positions))throw Error('Selection does not reproduce frozen positions');
await writeFile(out,JSON.stringify({...frozen,positions},null,2)+'\n');console.log('Reproduced all 32 frozen positions.');
