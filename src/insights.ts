import {Chess,type Move} from 'chess.js';
const values:Record<string,number>={p:1,n:3,b:3,r:5,q:9,k:0};
export function materialBalance(chess:Chess){return chess.board().flat().reduce((sum,p)=>sum+(p?(p.color==='w'?1:-1)*values[p.type]:0),0)}
export function moveFacts(move:Move,chess:Chess){
 const tags:string[]=[];
 if(chess.isCheckmate())tags.push('Checkmate');else if(chess.isCheck())tags.push('Check');
 if(move.promotion)tags.push('Promotion');
 if(move.captured)tags.push('Capture');
 if(move.isKingsideCastle()||move.isQueensideCastle())tags.push('Castling');
 return {tags,material:materialBalance(chess),captured:move.captured??null};
}
