import {spawn} from 'node:child_process';
const children=[spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','0.0.0.0','--port',process.env.PORT??'3217'],{stdio:'inherit'}),spawn(process.execPath,['--import','tsx','src/worker.ts'],{stdio:'inherit'})];
let stopping=false;
function stop(){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(1),5000).unref();}
for(const child of children){child.on('error',stop);child.on('exit',stop);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
