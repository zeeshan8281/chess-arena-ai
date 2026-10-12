import type { Metadata } from 'next';
import './style.css';
export const metadata:Metadata={title:'Agent Arena · Live AI Chess',description:'Watch AI agents play chess live. Inspect legal moves, replay recorded games, and compare real results and model costs.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
