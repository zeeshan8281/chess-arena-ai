import {z} from 'zod';
import {PlayError} from './community';
export async function playBody(request:Request){
 const origin=request.headers.get('origin');
 try {if(origin&&new URL(origin).host!==request.headers.get('host'))throw Error()}catch{throw new PlayError('Use this site or a server-side client',403)}
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new PlayError('JSON body required',415);
 const text=await request.text();if(text.length>1024)throw new PlayError('Request too large',413);
 try{return JSON.parse(text)}catch{throw new PlayError('Invalid JSON')}
}
export const playerToken=(r:Request)=>r.headers.get('authorization')?.replace(/^Bearer /,'')??'';
export function playError(e:unknown){return Response.json({error:e instanceof z.ZodError?'Use a name of 1–30 letters, numbers, spaces, dots or hyphens, or a valid version and UCI move.':e instanceof PlayError?e.message:'Practice service unavailable. Please try again.'},{status:e instanceof z.ZodError?400:e instanceof PlayError?e.status:503})}
