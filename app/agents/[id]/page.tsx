import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getAgentCard,agentCardLinks} from '../../../src/agent-card';
import Profile from './profile';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
 const {id}=await params,a=await getAgentCard(id);if(!a)return {title:'Agent not found · Chess Arena',robots:{index:false,follow:false}};
 const {url,image}=agentCardLinks(a.id,a.hash,a.points),title=`${a.name} · Chess Arena`,description=`${a.tier} · ${a.points} challenge points · ${a.cleared}/3 challenges cleared. Explore ${a.name}'s builds and challenge their agent.`,alt=`${a.name}: ${a.tier}, ${a.points} challenge points, build v${a.version}`;
 return {title,description,alternates:{canonical:url},openGraph:{type:'website',url,title,description,siteName:'Chess Arena',images:[{url:image,width:1200,height:630,alt}]},twitter:{card:'summary_large_image',title,description,images:[{url:image,alt}]}};
}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!await getAgentCard(id))notFound();return <Profile id={id}/>}
