import {Chess} from 'chess.js';
export function positionTurn(fenBefore:string,line:string[]){const chess=new Chess(fenBefore);const setup=line[0];if(!setup||line.length<2)throw Error('Puzzle requires setup and solution');chess.move({from:setup.slice(0,2),to:setup.slice(2,4),promotion:setup[4]});const legalMoves=chess.moves({verbose:true}).map(m=>m.from+m.to+(m.promotion??''));if(!legalMoves.includes(line[1]))throw Error('Illegal solution');return {fen:chess.fen(),legalMoves,historyUci:[setup],version:1}}
export function wilson(successes:number,total:number){if(!total)return {low:0,high:1};const z=1.959963984540054,p=successes/total,d=1+z*z/total,c=(p+z*z/(2*total))/d,h=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/d;return {low:Math.max(0,c-h),high:Math.min(1,c+h)}}

/** Reserve before sending; ambiguous failures retain their entire reservation. */
export function reserveAttempt(reservedMicros:number,allowanceMicros:number,reservationMicros:number){
 if(![reservedMicros,allowanceMicros,reservationMicros].every(Number.isSafeInteger)||reservedMicros<0||allowanceMicros<0||reservationMicros<=0)throw Error('Invalid budget');
 if(reservedMicros+reservationMicros>allowanceMicros)throw Error('Budget exhausted');
 return reservedMicros+reservationMicros;
}
export function settleAttempt(reservedMicros:number,reservationMicros:number,costMicros:number|null){
 if(costMicros===null)return reservedMicros;
 if(!Number.isSafeInteger(costMicros)||costMicros<0)throw Error('Invalid billing cost');
 return reservedMicros-reservationMicros+costMicros;
}
export function responseFailure(error:unknown){
 const message=error instanceof Error?error.message:'Unknown failure';
 const kind=/Budget/.test(message)?'budget':/billing/.test(message)?'billing':/HTTP|provider error/.test(message)?'provider':/deadline|abort/i.test(message)?'timeout':/illegal move/.test(message)?'illegal_move':/malformed|Missing model|Oversized move/.test(message)?'invalid_response':'transport_or_execution';
 return {message,kind,stop:['budget','billing'].includes(kind)||kind==='provider'&&/HTTP (400|401|402|403|404|429)/.test(message)};
}
