const fs=require('node:fs/promises'),path=require('node:path');
const failure=(status,message)=>Object.assign(new Error(message),{status});
function createStore(dir){
  const filename=path.join(dir,'board-state.json');let chain=Promise.resolve();
  async function read(){try{return JSON.parse(await fs.readFile(filename,'utf8'));}catch(e){if(e.code==='ENOENT')return {revision:0,state:null};throw e;}}
  function write(expected,state){const work=chain.then(async()=>{
    if(!Number.isSafeInteger(expected)||expected<0||!state||typeof state!=='object'||Array.isArray(state)||!state.controls||!state.members||!state.published||!state.draft||!Array.isArray(state.alarms))throw failure(400,'저장할 설정 형식을 확인해 주세요.');
    if(JSON.stringify(state).length>8*1024*1024)throw failure(413,'설정 자료가 너무 큽니다.');
    const old=await read();if(old.revision!==expected)throw failure(409,'다른 기기에서 먼저 수정했습니다. 최신 자료를 확인한 뒤 다시 저장해 주세요.');
    const next={revision:old.revision+1,state,updatedAt:new Date().toISOString()};await fs.mkdir(dir,{recursive:true,mode:0o700});
    const temp=filename+'.tmp';await fs.writeFile(temp,JSON.stringify(next),{mode:0o600});await fs.rename(temp,filename);return next;
  });chain=work.catch(()=>{});return work;}
  return {read,write};
}
module.exports={createStore};
