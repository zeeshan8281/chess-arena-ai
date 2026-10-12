import Match from './match';
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params; return <Match id={id}/>; }
