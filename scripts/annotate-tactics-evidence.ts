// Add provenance/billing annotations without changing recorded moves or historical runner hashes.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='public/benchmarks/tactics/';
const fixtureHash=createHash('sha256').update(await readFile(base+'positions.json')).digest('hex');
const harnessHash=createHash('sha256').update(await readFile('src/harness.ts')).digest('hex');
const summary=JSON.parse(await readFile(base+'summary.json','utf8'));
for(const row of summary.rows){const path='public'+row.evidence,report=JSON.parse(await readFile(path,'utf8'));
 const unknownCostAttempts=report.cases.filter((c:any)=>row.kind==='model'&&c.attempted&&(c.billingKnown===false||c.billingKnown===undefined&&c.error&&c.costMicros===0&&!/malformed|Received null|illegal move|Oversized move/.test(c.error))).length;
 row.unknownCostAttempts=unknownCostAttempts;row.fixtureHash=fixtureHash;
 report.unknownCostAttempts=unknownCostAttempts;report.fixtureHash=fixtureHash;
 report.annotation={at:new Date().toISOString(),fixtureHash,harnessHash,note:'Post-run integrity annotation of unchanged frozen positions and harness source; original sourceHash retained. Failed requests without billing are unknown, not free. Some initial pilot response token counts and finish reasons were not retained; later continuation records include them.'};
 await writeFile(path,JSON.stringify(report,null,2)+'\n');
}
summary.fixtureHash=fixtureHash;await writeFile(base+'summary.json',JSON.stringify(summary,null,2)+'\n');
