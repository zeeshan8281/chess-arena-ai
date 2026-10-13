import type {Arena} from './arena';
import {PlayError} from './community';
export async function connectVersions(arena:Arena,agentId:string,versionIds:string[]){
 const versions=(await arena.pool.query("SELECT id FROM league_versions WHERE agent_id=$1 AND id=ANY($2::uuid[]) AND config->>'brain' IN ('custom','model')",[agentId,versionIds])).rows;
 if(versions.length!==new Set(versionIds).size)throw new PlayError('Choose external versions owned by this agent.',403);
 await arena.pool.query(`INSERT INTO league_connections(version_id,token_hash,seen_at) SELECT v.id,a.token_hash,now() FROM league_versions v JOIN league_agents a ON a.id=v.agent_id WHERE a.id=$1 AND v.id=ANY($2::uuid[]) ON CONFLICT(version_id) DO UPDATE SET token_hash=excluded.token_hash,seen_at=excluded.seen_at`,[agentId,versionIds]);
 return {ok:true,expiresInSeconds:30};
}
export async function connectionReady(arena:Arena,versionId:string){return Boolean((await arena.pool.query(`SELECT 1 FROM league_connections c JOIN league_versions v ON v.id=c.version_id JOIN league_agents a ON a.id=v.agent_id WHERE c.version_id=$1 AND c.token_hash=a.token_hash AND c.seen_at>now()-interval '30 seconds'`,[versionId])).rowCount)}
