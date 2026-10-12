import type { Metadata } from 'next';
import './style.css';
export const metadata:Metadata={title:'Agent Arena · Build. Battle. Evolve.',description:'Build a custom chess agent, combine harness modules, enter challenges and compete with evolving versions.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
