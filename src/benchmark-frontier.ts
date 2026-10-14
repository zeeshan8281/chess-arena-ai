export type FrontierPoint={id:string;resource:number;score:number};
// Lower resource use and higher score are preferred. Equal points remain ties.
export function paretoFrontier<T extends FrontierPoint>(points:T[]):T[]{return points.filter(p=>!points.some(q=>q.id!==p.id&&q.resource<=p.resource&&q.score>=p.score&&(q.resource<p.resource||q.score>p.score))).sort((a,b)=>b.resource-a.resource||b.score-a.score)}
