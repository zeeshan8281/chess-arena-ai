import {cache} from 'react';
import {z} from 'zod';
import {getArena} from './db';
import {profile} from './league';
import {origin} from './auth';
export const getAgentCard=cache(async(id:string)=>{if(!z.string().uuid().safeParse(id).success)return null;try{const p=await profile(await getArena(),id),v=p.versions[0];return {id:p.id,name:p.name,tier:p.progress.tier,points:p.progress.points,cleared:p.progress.cleared.length,versions:p.versions.length,version:v.number,label:v.config.label,brain:v.config.brain,model:v.config.model,hash:v.config_hash,modules:[v.config.mateGuard?'Mate radar':null,v.config.safety?'Safety check':null,v.config.center?'Center control':null].filter(Boolean) as string[]}}catch(e){if((e as {status?:number}).status===404)return null;throw e}});
export function agentCardLinks(id:string,hash:string,points:number){const url=origin()+'/agents/'+id;return {url,image:url+'/card?v='+hash.slice(0,12)+'&p='+points}}
