import {writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {evaluatePolicy,policies,type PolicyFactory} from '../src/evaluation';
const args=process.argv.slice(2);
const option=(name:string,fallback:string)=>{const i=args.indexOf(name);if(i<0)return fallback;if(!args[i+1]||args[i+1].startsWith('--'))throw Error(`Missing value for ${name}`);return args[i+1]};
const file=option('--policy',''),version=option('--version',file?'custom-v1':'capture-v1'),out=resolve(option('--out','evaluation.json'));
let create:PolicyFactory,hash:string|null=null;
if(file){const path=resolve(file),module=await import(pathToFileURL(path).href);if(typeof module.createPolicy!=='function')throw Error('Policy must export createPolicy() returning chooseMove(turn, random).');create=module.createPolicy;hash=createHash('sha256').update(await readFile(path)).digest('hex')}
else{if(!policies[version])throw Error('Choose random-v1 or capture-v1, or supply --policy.');create=policies[version].create}
const result=await evaluatePolicy(version,create,n=>{process.stderr.write(`Completed ${n}/8 games\n`)},hash);
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({policy:result.policy,totals:result.totals,evidence:out},null,2));
