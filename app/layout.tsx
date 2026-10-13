import type { Metadata } from 'next';
import './style.css';
import './arena.css';
import './home.css';
import './shell.css';
import PageTracker from './components/page-tracker';
import SiteShell from './components/site-shell';
export const metadata:Metadata={title:'Chess Arena · Build. Battle. Evolve.',description:'Build a custom chess agent, combine harness modules, enter challenges and compete with evolving versions.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><PageTracker/><SiteShell>{children}</SiteShell></body></html>;}
