import type {Metadata} from 'next';
import TacticsBenchmark from '../components/tactics-benchmark';
import Benchmarks from '../components/benchmarks';

export const metadata:Metadata={
 title:'Benchmarks · Chess Arena',
 description:'Compare models and harnesses on 32 fixed chess positions, with first-move accuracy, uncertainty intervals, latency, cost, and decision evidence.',
};

export default function BenchmarksPage(){
 return <main className="overview-page" aria-label="Chess Arena benchmarks">
  <TacticsBenchmark/>
  <details className="baseline-archive">
   <summary>Baseline sanity check: games against Random Walk ↓</summary>
   <Benchmarks/>
  </details>
 </main>;
}
