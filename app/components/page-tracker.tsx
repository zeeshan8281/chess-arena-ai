'use client';
import {usePathname} from 'next/navigation';
import {useEffect,useRef} from 'react';
export default function PageTracker(){const path=usePathname(),last=useRef('');useEffect(()=>{
 if(last.current===path)return;last.current=path;
 if(path.startsWith('/analytics')||navigator.doNotTrack==='1')return;
 const body=JSON.stringify({id:crypto.randomUUID(),path,referrer:document.referrer});
 void fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
 },[path]);return null}
