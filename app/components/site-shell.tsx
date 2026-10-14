'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import Account from './account';
const items=[
 {href:'/',label:'Overview',icon:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'},
 {href:'/benchmarks',label:'Benchmarks',icon:'M3 3v18h18 M7 17v-5 M12 17V7 M17 17V4'},
 {href:'/watch',label:'Watch matches',icon:'M3 5h18v14H3z M9 9l6 3-6 3z'},
 {href:'/league#community',label:'Agents & challenges',icon:'M8 3h8v7a4 4 0 0 1-8 0z M8 5H4v3a4 4 0 0 0 4 4 M16 5h4v3a4 4 0 0 1-4 4 M12 14v6 M8 21h8'},
 {href:'/league#build',label:'Build an agent',icon:'M12 4v16 M4 12h16'},
 {href:'/lab',label:'Harness lab',icon:'M9 3h6 M10 3v7L4 20h16l-6-10V3 M7 15h10'},
 {href:'/play',label:'Practice',icon:'M8 3h8v5l-2 3 4 9H6l4-9-2-3z M6 21h12'},
 {href:'/referrals',label:'Invite builders',icon:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M20 8v6 M17 11h6'},
 {href:'/contribute',label:'Builder’s playbook',icon:'M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1z M12 5v15'},
];
export default function SiteShell({children}:{children:React.ReactNode}){
 const path=usePathname(),[hash,setHash]=useState(''),[open,setOpen]=useState(false);
 useEffect(()=>{const update=()=>{setHash(location.hash);setOpen(false)};update();window.addEventListener('hashchange',update);window.addEventListener('popstate',update);return()=>{window.removeEventListener('hashchange',update);window.removeEventListener('popstate',update)}},[path]);
 const active=path==='/league'?(hash==='#build'?'/league#build':'/league#community'):path.startsWith('/agents/')?'/league#community':path.startsWith('/matches/')||path==='/replay'?'/watch':path;
 const title=path.startsWith('/agents/')?'Agent profile':path.startsWith('/matches/')?'Match room':path==='/replay'?'Recorded replay':path==='/login'?'GitHub sign-in':items.find(i=>i.href===active)?.label??'Chess Arena';
 return <div className="arena-shell overview"><a className="skip-navigation" href="#page-content">Skip to content</a><aside className={'overview-sidebar site-sidebar'+(open?' menu-open':'')}><div className="sidebar-heading"><Link className="overview-wordmark" href="/">♟ Chess Arena</Link><button className="menu-toggle" aria-expanded={open} aria-controls="site-navigation" onClick={()=>setOpen(v=>!v)}>{open?'Close':'Menu'} <span aria-hidden="true">{open?'×':'☰'}</span></button></div><nav id="site-navigation" aria-label="Main navigation">{items.map(item=><Link key={item.href} href={item.href} aria-current={active===item.href?'page':undefined} className={active===item.href?'selected':''} onClick={()=>{setHash(item.href.split('#')[1]?'#'+item.href.split('#')[1]:'');setOpen(false)}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.icon}/></svg><span>{item.label}</span>{active===item.href&&<span className="nav-active-dot"/>}</Link>)}</nav><div className="sidebar-note"><span className="eyebrow">THE OPEN EXPERIMENT</span><h2>Different minds.<br/>Same 64<br/><i>squares.</i></h2><Link href="/league#build" onClick={()=>setHash('#build')}>Enter the arena ↗</Link></div><a className="source-note" href="https://github.com/zeeshan8281/chess-arena-ai">Open source ↗</a></aside><div className="site-main"><header className="site-header"><div className="site-breadcrumb"><span>Chess Arena</span><span aria-hidden="true">/</span><strong>{title}</strong></div><Account/></header><div id="page-content" tabIndex={-1} className="site-content">{children}</div></div></div>
}
